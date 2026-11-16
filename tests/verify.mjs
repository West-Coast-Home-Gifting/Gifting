// Playwright verification: screenshots at 375/768/1440 x 0/25/50/75/100% scroll, plus dead-scroll,
// text-reveal, contrast, console-error, blank-canvas and draw-call checks. Writes tests/report.json.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const CHROME = process.env.CHROME || '/usr/bin/google-chrome'
const VIEWPORTS = [{ w: 375, h: 812 }, { w: 768, h: 1024 }, { w: 1440, h: 900 }]
const STOPS = [0, 0.25, 0.5, 0.75, 1]
const GPU_ARGS = ['--no-sandbox', '--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
const report = { checks: [], issues: [], draw: [], contrast: [] }
const issue = (m) => { report.issues.push(m); console.log('ISSUE', m) }

const lum = (r, g, b) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const parseColor = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 } }

async function scrollToFrac(page, f) {
  await page.evaluate(async (f) => {
    const max = document.documentElement.scrollHeight - innerHeight
    const target = Math.round(max * f)
    let y = scrollY
    const step = innerHeight * 0.35 * (target >= y ? 1 : -1)
    while (Math.abs(target - y) > Math.abs(step)) { y += step; scrollTo(0, y); await new Promise((r) => setTimeout(r, 55)) }
    scrollTo(0, target)
  }, f)
  await page.waitForTimeout(2300)
}

async function textBoxes(page) {
  return page.evaluate(() => {
    const out = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const txt = node.textContent.trim()
      const el = node.parentElement
      if (!txt || !el || el.closest('script,style,svg,noscript') || el.closest('.sr-only')) continue
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) {
        if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
        // content scrolling under the fixed header is expected; header itself is tested
        if (r.top + r.height / 2 < 76 && !el.closest('.site-header')) continue
        let op = 1, n = el, hidden = false
        while (n && n !== document.body) { const cs = getComputedStyle(n); op *= parseFloat(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true; n = n.parentElement }
        if (hidden || op < 0.6) continue
        const cs = getComputedStyle(el)
        out.push({ txt: txt.slice(0, 40), x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top), color: cs.color, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight), tag: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] })
      }
    }
    return out
  })
}

async function contrastCheck(page, tag, vp) {
  const boxes = await textBoxes(page)
  await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important}input::placeholder{color:transparent!important}' }).then(async (h) => {
    await page.waitForTimeout(250)
    const buf = await page.screenshot()
    const png = PNG.sync.read(buf)
    await h.evaluate((n) => n.remove())
    for (let b of boxes) {
      const tc = parseColor(b.color)
      const tl = lum(tc.r, tc.g, tc.b)
      const lums = []
      const inset = 0
      const x0 = Math.floor(b.x + b.w * inset), y0 = Math.floor(b.y + b.h * inset)
      b = { ...b, w: b.w * (1 - 2 * inset), h: b.h * (1 - 2 * inset) }
      for (let y = y0; y < Math.min(png.height, y0 + b.h); y += 2)
        for (let x = x0; x < Math.min(png.width, x0 + b.w); x += 2) {
          const i = (png.width * y + x) * 4
          lums.push(lum(png.data[i], png.data[i + 1], png.data[i + 2]))
        }
      if (!lums.length) continue
      lums.sort((a, c) => a - c)
      const p5 = lums[Math.floor(lums.length * 0.03)], p95 = lums[Math.min(lums.length - 1, Math.floor(lums.length * 0.97))]
      const mid = lums[Math.floor(lums.length / 2)]
      const worstBg = tl > mid ? p95 : p5
      const ratio = (Math.max(tl, worstBg) + 0.05) / (Math.min(tl, worstBg) + 0.05)
      const large = b.size >= 24 || (b.size >= 18.66 && b.weight >= 700)
      const need = large ? 3 : 4.5
      const rec = { tag, vp, el: b.tag, txt: b.txt, ratio: +ratio.toFixed(2), need }
      report.contrast.push(rec)
      if (ratio < need) { const c = new PNG({ width: Math.max(1, Math.floor(b.w)), height: Math.max(1, Math.floor(b.h)) }); PNG.bitblt(png, c, x0, y0, c.width, c.height, 0, 0); fs.writeFileSync(`tests/shots/fail-${tag.replace('%', '')}-${vp}-${report.issues.length}.png`, PNG.sync.write(c)) }
      if (ratio < need) issue(`contrast ${ratio.toFixed(2)} < ${need} at ${tag} ${vp}: ${b.tag} "${b.txt}"`)
    }
  })
}

function canvasBlank(buf) {
  const png = PNG.sync.read(buf)
  let n = 0, sum = 0, sum2 = 0
  for (let i = 0; i < png.data.length; i += 4 * 17) { const l = lum(png.data[i], png.data[i + 1], png.data[i + 2]); sum += l; sum2 += l * l; n++ }
  const mean = sum / n
  return { mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)) }
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: GPU_ARGS })

  // ---------- A. full-effects pass on the WebGL 2 backend (pixel-verifiable in this sandbox) ----------
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, hasTouch: vp.w < 768, isMobile: vp.w < 768 })
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    await page.goto(`${BASE}/?tier=high&renderer=webgl`, { waitUntil: 'load' })
    if (vp.w < 768) {
      // phones: 3D starts on first interaction; first check the CSS placeholder state people see before that
      await page.waitForTimeout(1200)
      const early = await page.evaluate(() => !!document.querySelector('#stage canvas'))
      if (early) issue('mobile: 3D started before any interaction')
      await page.screenshot({ path: `tests/shots/${vp.w}-pre3d.png` })
      await contrastCheck(page, 'pre3d', vp.w)
      await page.evaluate(() => scrollBy(0, 2))
    }
    await page.waitForFunction(() => document.documentElement.classList.contains('stage-ready'), null, { timeout: 20000 }).catch(() => issue(`stage never became ready at ${vp.w}`))
    await page.waitForTimeout(1500)

    const dims = await page.evaluate(() => ({ H: document.documentElement.scrollHeight, vh: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }))
    report.checks.push({ vp: vp.w, ...dims })
    if (dims.H < dims.vh * 6) issue(`page unexpectedly short at ${vp.w}: ${dims.H}`)
    if (dims.sw > dims.iw + 1) issue(`horizontal overflow at ${vp.w}: ${dims.sw} > ${dims.iw}`)

    let lastY = -1
    for (const f of STOPS) {
      await scrollToFrac(page, f)
      const y = await page.evaluate(() => scrollY)
      const max = dims.H - dims.vh
      if (Math.abs(y - Math.round(max * f)) > 4) issue(`dead scroll at ${vp.w} ${f * 100}%: wanted ${Math.round(max * f)} got ${y}`)
      if (f > 0 && y <= lastY) issue(`scroll did not advance at ${vp.w} ${f * 100}%`)
      lastY = y
      const file = `tests/shots/${vp.w}-${Math.round(f * 100)}.png`
      const buf = await page.screenshot({ path: file })
      const cv = canvasBlank(buf)
      if (cv.std < 0.004 && f !== 1) issue(`possibly blank/flat frame at ${vp.w} ${f * 100}% (std ${cv.std.toFixed(4)})`)
      const info = await page.evaluate(() => { const g = window.__gl; return g ? { calls: g.info.render.drawCalls, tris: g.info.render.triangles, backend: window.__backend } : null })
      if (info) { report.draw.push({ vp: vp.w, f, ...info }); if (info.calls >= 100) issue(`draw calls ${info.calls} >= 100 at ${vp.w} ${f}`) }
      await contrastCheck(page, `${Math.round(f * 100)}%`, vp.w)
    }

    // every reveal line must end fully revealed once the page has been walked through
    const stuck = await page.evaluate(() => {
      const bad = []
      document.querySelectorAll('[data-reveal="lines"] .line').forEach((l) => {
        const m = new DOMMatrix(getComputedStyle(l).transform)
        if (Math.abs(m.f) > 1) bad.push((l.textContent || '').slice(0, 30))
      })
      return bad
    })
    if (stuck.length) issue(`text never fully appeared at ${vp.w}: ${stuck.join(' | ')}`)
    const mask = await page.evaluate(() => document.querySelectorAll('[data-reveal="lines"] .line').length)
    report.checks.push({ vp: vp.w, revealLines: mask })

    const real = errors.filter((e) => !/GL Driver|ReadPixels|Clock|PCFSoft/.test(e))
    if (real.length) issue(`console errors at ${vp.w}: ${real.slice(0, 4).join(' || ')}`)
    await ctx.close()
  }

  // ---------- B. default WebGPU backend: does it initialise cleanly (no pixel check possible headless) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errs = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${m.type()}] ${m.text()}`) })
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    await page.goto(`${BASE}/?tier=high&renderer=webgpu`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.classList.contains('stage-ready'), null, { timeout: 20000 }).catch(() => issue('webgpu: stage never ready'))
    await page.waitForTimeout(2500)
    await scrollToFrac(page, 0.5)
    const info = await page.evaluate(() => ({ backend: window.__backend, calls: window.__gl?.info.render.drawCalls }))
    const real = errs.filter((e) => !/Clock|PCFSoft|popErrorScope|GL Driver/.test(e))
    report.webgpu = { ...info, errorCount: real.length, firstError: real[0] }
    await ctx.close()
  }

  // ---------- C. reduced motion: static poster + stacked sections ----------
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    const st = await page.evaluate(() => ({ poster: document.documentElement.classList.contains('poster'), canvas: !!document.querySelector('#stage canvas'), lenis: document.documentElement.classList.contains('lenis'), hidden: [...document.querySelectorAll('h1,h2,h3,.huge')].filter((e) => { const r = e.getBoundingClientRect(); return getComputedStyle(e).visibility === 'hidden' || r.width === 0 }).length, sw: document.documentElement.scrollWidth, iw: innerWidth }))
    report.checks.push({ reduced: vp.w, ...st })
    if (!st.poster || st.canvas || st.lenis) issue(`reduced-motion not static at ${vp.w}: ${JSON.stringify(st)}`)
    if (st.sw > st.iw + 1) issue(`reduced-motion horizontal overflow at ${vp.w}`)
    await page.screenshot({ path: `tests/shots/reduced-${vp.w}-top.png` })
    await page.screenshot({ path: `tests/shots/reduced-${vp.w}-full.png`, fullPage: true })
    for (const f of [0, 0.5, 1]) { await scrollToFrac(page, f); await contrastCheck(page, `reduced-${Math.round(f * 100)}%`, vp.w) }
    if (errors.length) issue(`reduced-motion console errors: ${errors.slice(0, 3).join(' || ')}`)
    await ctx.close()
  }

  await browser.close()
  fs.writeFileSync('tests/report.json', JSON.stringify(report, null, 2))
  const minC = report.contrast.reduce((m, c) => (c.ratio / c.need < m.ratio / m.need ? c : m), report.contrast[0])
  console.log(`\nDONE. issues: ${report.issues.length}. contrast samples: ${report.contrast.length}, tightest: ${minC?.ratio} (need ${minC?.need}) ${minC?.el} @${minC?.tag}/${minC?.vp}`)
  console.log('draw calls max:', Math.max(0, ...report.draw.map((d) => d.calls)), '| webgpu:', JSON.stringify(report.webgpu))
}
run().catch((e) => { console.error(e); process.exit(1) })

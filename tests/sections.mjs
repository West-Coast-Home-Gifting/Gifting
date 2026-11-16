// Visual review helper: screenshots at section-relative progress (not just global 0/25/50/75/100).
import { chromium } from '@playwright/test'
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const vp = process.argv[2] === 'm' ? { width: 375, height: 812 } : { width: 1440, height: 900 }
const tag = process.argv[2] === 'm' ? 'm' : 'd'
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: vp, hasTouch: tag === 'm', isMobile: tag === 'm' })
const page = await ctx.newPage()
await page.goto(`${BASE}/?tier=high&renderer=webgl`)
await page.waitForFunction(() => document.documentElement.classList.contains('stage-ready'), null, { timeout: 20000 })
await page.waitForTimeout(1200)
const shots = [['hero', 0], ['problem', 0.3], ['signature', 0.3], ['signature', 0.5], ['signature', 0.75], ['signature', 1], ['science', 0.35], ['science', 0.7], ['science', 1], ['materials', 0.5], ['how', 0.2], ['how', 0.55], ['how', 1], ['waitlist', 1]]
for (const [id, f] of shots) {
  const y = await page.evaluate(([id, f]) => {
    const el = document.querySelector(`[data-section="${id}"]`)
    const top = el.getBoundingClientRect().top + scrollY
    return Math.round(top + Math.max(0, el.offsetHeight - innerHeight) * f)
  }, [id, f])
  await page.evaluate(async (y) => {
    let c = scrollY
    const step = innerHeight * 0.4 * (y >= c ? 1 : -1)
    while (Math.abs(y - c) > Math.abs(step)) { c += step; scrollTo(0, c); await new Promise((r) => setTimeout(r, 50)) }
    scrollTo(0, y)
  }, y)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `/tmp/sec-${tag}-${id}-${Math.round(f * 100)}.png` })
}
await browser.close()

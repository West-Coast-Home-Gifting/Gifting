import { chromium } from '@playwright/test'
const url = process.argv[2] || 'http://127.0.0.1:4173/?tier=high'
const out = process.argv[3] || '/tmp/probe.png'
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: (process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ') : ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU']),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(6000)
console.log('backend', await page.evaluate(() => window.__backend), 'webgpu in nav', await page.evaluate(() => 'gpu' in navigator))
await page.screenshot({ path: out })
console.log(logs.filter(l=>!l.includes("popErrorScope")).slice(0, 30).join('\n'))
await browser.close()

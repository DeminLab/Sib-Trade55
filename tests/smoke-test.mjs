import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

// Read-only smoke: dynamic routes come from the current storefront, not demo data.
const base = process.env.BASE_URL ?? 'http://localhost:3000'
const output = resolve('docs/qa/smoke')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true })
const results = []
try {
  for (const width of [320, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    if (process.env.SMOKE_COOKIE) await context.addCookies([{ name: 'sib_trade_session', value: process.env.SMOKE_COOKIE, url: base }])
    const page = await context.newPage()
    await page.goto(`${base}/shop`)
    const categories = await page.locator('nav[aria-label="Направления каталога"] a').evaluateAll(elements => elements.map(element => element.getAttribute('href')))
    const products = await page.locator('main article a[aria-label^="Подробнее:"]').evaluateAll(elements => elements.slice(0, 2).map(element => element.getAttribute('href')))
    const routes = new Set(['/', '/shop', '/shop?page=2', '/shop?q=zz-no-results-zz', '/search?q=скамейка', '/cart', '/wishlist', '/checkout', '/quote', '/contact', '/custom', '/materials', '/cases', '/blog', '/pages', '/brands', '/about', '/how-we-work', '/faq', '/auth/login', '/auth/register', '/auth/forgot-password', '/policies/privacy', '/policies/terms', '/policies/shipping', '/policies/returns', ...categories, ...products])
    for (const index of ['/blog', '/pages', '/cases']) {
      await page.goto(`${base}${index}`)
      const links = await page.locator(`main a[href^="${index}/"]`).evaluateAll(elements => elements.slice(0, 2).map(element => element.getAttribute('href')))
      links.forEach(path => routes.add(path))
    }
    if (process.env.SMOKE_COOKIE) ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/contacts', '/admin/quotes', '/admin/custom-requests', '/admin/content', '/admin/portfolio', '/admin/settings'].forEach(path => routes.add(path))
    for (const path of routes) {
      const errors = []
      const handler = error => errors.push(error.message)
      page.on('pageerror', handler)
      try {
        const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
        assert.equal(response.status(), 200)
        await page.locator('main h1').first().waitFor({ state: 'visible' })
        assert.equal(await page.locator('h1').count(), 1)
        const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
        assert.ok(size.scroll <= size.client + 1, `Horizontal overflow: ${JSON.stringify(size)}`)
        assert.deepEqual(errors, [])
        results.push({ path, width, status: 'PASS' })
        if (['/shop', '/admin', '/materials'].includes(path)) await page.screenshot({ path: join(output, `${width}-${path.slice(1)}.png`), fullPage: true })
      } catch (error) { results.push({ path, width, status: 'FAIL', message: error.message }) }
      finally { page.off('pageerror', handler) }
    }
    const missing = await page.goto(`${base}/qa-this-route-does-not-exist`, { waitUntil: 'networkidle' })
    assert.ok([200, 404].includes(missing.status()))
    assert.match(await page.content(), /Страница не найдена/)
    assert.match(await page.content(), /noindex/)
    await context.close()
  }
} finally { await browser.close() }
writeFileSync(join(output, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), base, results }, null, 2))
const failures = results.filter(result => result.status === 'FAIL')
console.log(JSON.stringify({ checked: results.length, passed: results.length - failures.length, failures }, null, 2))
if (failures.length) process.exitCode = 1

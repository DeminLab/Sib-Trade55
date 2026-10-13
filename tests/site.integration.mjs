import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { DatabaseSync } from 'node:sqlite'
import { createHmac } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'sib-trade-site-'))
const databasePath = join(directory, 'qa-site.sqlite')
const db = new DatabaseSync(databasePath)
db.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE catalog_media(path TEXT PRIMARY KEY, content_type TEXT NOT NULL, data BLOB NOT NULL)')
const original = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const baseProduct = structuredClone(original.products.find(p => p.status === 'active'))
const image = { url: '/api/catalog/media/qa-image.png', alt: 'Тестовый товар' }
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64')
db.prepare('INSERT INTO catalog_media VALUES(?,?,?)').run('uploads/qa-image.png', 'image/png', png)
const categories = [{ id: 'qa-root', name: 'Каталог оборудования', slug: 'qa-catalog', description: 'Тест', order: 0 }, { id: 'qa-parent', name: 'Уличная мебель', slug: 'qa-furniture', parentId: 'qa-root', description: 'Тест', order: 1 }, { id: 'qa-child', name: 'Скамейки', slug: 'qa-benches', parentId: 'qa-parent', description: 'Тест', order: 1 }, { id: 'qa-tables', name: 'Столы', slug: 'qa-tables', parentId: 'qa-parent', description: 'Тест', order: 2 }]
const products = Array.from({ length: 27 }, (_, i) => ({ ...structuredClone(baseProduct), id: `qa-product-${i}`, name: `Тестовая скамейка ${i}`, slug: `qa-bench-${i}`, status: i === 26 ? 'archived' : 'active', categoryIds: [i === 25 ? 'qa-tables' : 'qa-child'], images: [image], brandId: 'qa-brand', body: '<p>Тестовое описание</p>', variants: [{ ...structuredClone(baseProduct.variants[0]), id: `qa-variant-${i}`, productId: `qa-product-${i}`, name: 'Стандарт', sku: `ST-QA-${i}`, price: 1000 + i, priceOnRequest: false, options: [], inventory: { quantity: 3, trackInventory: true, allowBackorder: false }, images: [image] }] }))
products[0].variants.push({ ...structuredClone(products[0].variants[0]), id: 'qa-variant-extra', name: 'Большая', sku: 'ST-QA-EXTRA', price: 5000, inventory: { quantity: 0, trackInventory: true, allowBackorder: true } })
products[1].variants[0].options = [{ name: 'Размер', value: 'Малый' }, { name: 'Цвет', value: 'Чёрный' }]
products[1].variants.push({ ...structuredClone(products[1].variants[0]), id: 'qa-variant-combination', name: 'Большой красный', sku: 'ST-QA-COMBO', price: 2001, options: [{ name: 'Размер', value: 'Большой' }, { name: 'Цвет', value: 'Красный' }] })
const seed = db.prepare('INSERT INTO app_state VALUES(?,?)')
seed.run('catalog', JSON.stringify({ products, categories, brands: [{ id: 'qa-brand', name: 'Тестовый бренд', slug: 'qa-brand', description: '' }] }))
seed.run('media_imported', '1')
for (const key of ['blog', 'cases', 'materials', 'pages']) seed.run(`content:${key}`, readFileSync(`src/data/${key}.json`, 'utf8'))
db.close()
const port = Number(process.env.QA_PORT ?? 3101)
const base = `http://127.0.0.1:${port}`
const secret = 'qa-site-session-secret'
const sign = role => { const payload = Buffer.from(JSON.stringify({ role, expiresAt: Date.now() + 3600000 })).toString('base64url'); return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}` }
const auth = { Cookie: `sib_trade_session=${sign('admin')}` }
let child; let output = ''; const passed = []
async function start({ bootstrapAdmin = true } = {}) {
  child = spawn(process.execPath, ['.next/standalone/server.js'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: String(port), SQLITE_DATABASE_PATH: databasePath, ADMIN_EMAIL: bootstrapAdmin ? 'qa-admin@example.com' : '', ADMIN_PASSWORD: bootstrapAdmin ? 'qa-testing-password' : '', AUTH_SESSION_SECRET: secret, AUTH_COOKIE_SECURE: 'false', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '', DATABASE_URL: '', PGHOST: '' }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', chunk => { output += chunk }); child.stderr.on('data', chunk => { output += chunk })
  for (let i = 0; i < 100; i++) { if (child.exitCode !== null) throw new Error(output.slice(-2000)); try { if ((await fetch(`${base}/api/admin/settings`, { headers: auth })).ok) return } catch {} await new Promise(r => setTimeout(r, 200)) }
  throw new Error('QA server startup timed out')
}
async function stop() { if (child && child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done } }
async function call(path, method = 'GET', body, expected = 200, headers = auth) {
  const res = await fetch(`${base}${path}`, { method, headers: body instanceof FormData ? headers : { ...headers, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) })
  assert.ok(Array.isArray(expected) ? expected.includes(res.status) : res.status === expected, `${method} ${path}: HTTP ${res.status}, expected ${JSON.stringify(expected)}`)
  return res.headers.get('content-type')?.includes('json') ? res.json() : res.text()
}
function pass(name) { passed.push(name); console.log(`PASS ${name}`) }
function productForm(product = products[0]) {
  const form = new FormData(); form.append('payload', JSON.stringify({ ...product, price: product.variants[0].price, priceOnRequest: false, sku: product.variants[0].sku })); return form
}
try {
  await start()
  for (const path of ['/api/admin/overview', '/api/admin/settings', '/api/admin/content/pages', '/api/admin/media', '/api/admin/products', '/api/admin/categories', '/api/orders']) {
    for (const headers of [{}, { Cookie: `sib_trade_session=${sign('customer')}` }, { Cookie: 'sib_trade_session=forged.invalid' }]) await call(path, path.endsWith('/media') ? 'POST' : 'GET', undefined, 401, headers)
  }
  await call('/api/auth/login', 'POST', { email: 'qa-admin@example.com', password: 'wrong-password' }, 401, {})
  const logged = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@example.com', password: 'qa-testing-password' }) })
  assert.equal(logged.status, 200); assert.match(logged.headers.get('set-cookie'), /HttpOnly/)
  const loginUser = (await logged.json()).user
  assert.equal(loginUser.role, 'admin')
  assert.equal(Object.hasOwn(loginUser, 'password_hash'), false)
  const loginCookie = logged.headers.get('set-cookie').split(';')[0]
  const currentSession = await call('/api/auth/session', 'GET', undefined, 200, { Cookie: loginCookie }); assert.equal(currentSession.user.role, 'admin')
  assert.equal((await call('/api/auth/session', 'GET', undefined, 200, {})).user, null)
  const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST' }); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
  pass('authentication, role boundaries and private administrative endpoints')
  const matches = await call('/api/catalog/search?q=ST-QA-EXTRA', 'GET', undefined, 200, {}); assert.equal(matches.items[0].id, products[0].id)
  for (const path of ['/shop?q=ST-QA-EXTRA&q=other', '/search?q=ST-QA-EXTRA&q=other', '/qa-furniture?q=ST-QA-EXTRA&q=other']) await call(path, 'GET', undefined, 200, {})
  const archived = await call(`/api/catalog/products?id=${products[26].id}`, 'GET', undefined, 200, {}); assert.equal(archived.items.length, 0)
  const categoryPage = await call('/qa-furniture?category=qa-tables', 'GET', undefined, 200, {}); assert.match(categoryPage, /Тестовая скамейка 25/); assert.doesNotMatch(categoryPage, /Подробнее: Тестовая скамейка 0"/)
  await call('/shop?category=unknown-category', 'GET', undefined, 200, {}).then(html => assert.match(html, /Товары не найдены/))
  await call('/shop?min=4900&max=5100', 'GET', undefined, 200, {}).then(html => assert.match(html, /Тестовая скамейка 0/))
  await call('/shop?page=99999', 'GET', undefined, 200, {}).then(html => assert.match(html, /Тестовая скамейка 25/))
  assert.equal((await fetch(`${base}${image.url}`)).status, 200)
  pass('SKU search, category descendants, alternate variant prices, pagination, archived visibility, image delivery')
  const notFoundHtml = await call('/qa-bench-26', 'GET', undefined, [200, 404], {})
  assert.match(notFoundHtml, /Страница не найдена/); assert.match(notFoundHtml, /noindex/)
  const categoryCreation = new FormData(); categoryCreation.append('payload', JSON.stringify({ name: 'Тестовая категория', slug: 'qa-new-category', description: '', parentId: 'qa-root', order: 5, image: null }))
  const createdCategory = await call('/api/admin/categories', 'POST', categoryCreation, 201)
  const createdProduct = await call('/api/admin/products', 'POST', productForm({ ...products[0], name: 'Новый тестовый товар', slug: 'qa-new-product', status: 'draft', categoryIds: [createdCategory.item.id] }), 201)
  assert.equal(createdProduct.item.status, 'draft')
  await call('/api/admin/products', 'POST', productForm({ ...products[0], slug: 'shop' }), 400)
  await call(`/api/admin/products/${products[0].id}`, 'DELETE', undefined, 409)
  pass('category/product creation, reserved route rejection and active-product deletion protection')
  const edited = { ...products[0], name: 'Обновлённая тестовая скамейка' }
  await call(`/api/admin/products/${products[0].id}`, 'PUT', productForm(edited))
  assert.equal((await call(`/api/admin/products/${products[0].id}`)).item.name, edited.name)
  await call('/api/admin/products', 'PATCH', { ids: [products[0].id, products[1].id], status: 'archived' })
  assert.equal((await call(`/api/catalog/products?id=${products[0].id}`, 'GET', undefined, 200, {})).items.length, 0)
  await call('/api/admin/products', 'PATCH', { ids: [products[0].id, products[1].id], status: 'active' })
  const categoryForm = new FormData(); categoryForm.append('payload', JSON.stringify({ ...categories[3], parentId: '', image: null }))
  const changedCategory = await call('/api/admin/categories/qa-tables', 'PUT', categoryForm); assert.equal(changedCategory.item.parentId, undefined)
  categoryForm.set('payload', JSON.stringify({ ...categories[1], parentId: 'qa-child', image: null })); await call('/api/admin/categories/qa-parent', 'PUT', categoryForm, 409)
  pass('product editing, bulk archive/restore, category reparenting and cycle protection')
  const mediaForm = new FormData(); mediaForm.append('image', new Blob([readFileSync('public/images/hero-park-composite.png')], { type: 'image/png' }), 'test-image.png')
  const uploaded = await call('/api/admin/media', 'POST', mediaForm)
  assert.match(uploaded.url, /^\/api\/catalog\/media\//); assert.equal((await fetch(`${base}${uploaded.url}`)).status, 200)
  const invalidFile = new FormData(); invalidFile.append('image', new Blob(['invalid'], { type: 'image/png' }), 'broken.png'); await call('/api/admin/media', 'POST', invalidFile, 400)
  pass('image upload, conversion to WebP, stored media delivery and invalid image rejection')
  const line = products[0].variants[0]
  const orderBody = { items: [{ id: 'fake', productId: products[0].id, variantId: line.id, name: 'Fake name', variantName: '', sku: '', image, price: 1, quantity: 2, total: 2 }], subtotal: 2, tax: 99, shipping: 999, total: 2, currency: 'RUB', shippingAddress: { id: 'test', type: 'shipping', firstName: 'Тест', lastName: 'Тест', line1: 'Тестовая улица', city: 'Омск', state: 'Омская область', postalCode: '644000', country: 'RU', isDefault: true }, customerName: 'Тестовый заказчик', customerEmail: 'qa@example.com', customerPhone: '+79990000000' }
  const order = await call('/api/orders', 'POST', orderBody, 201, {}); assert.equal(order.total, 2000); assert.equal(order.shipping, 0); assert.equal(order.items[0].name, edited.name)
  await call('/api/orders', 'POST', { ...orderBody, items: [{ ...orderBody.items[0], quantity: 4 }] }, 409, {})
  await call(`/api/admin/orders/${order.id}`, 'PATCH', { status: 'processing' }); await call(`/api/admin/orders/${order.id}`, 'PATCH', { status: 'invalid' }, 400)
  pass('checkout canonical prices, stock validation and saved order status')
  await call('/api/contact', 'POST', { name: 'Тест Русского Поиска', phone: '+79990000000', email: '', subject: 'Заказать звонок', message: 'Тестовый обратный звонок', preferredContact: 'phone' }, 201, {})
  assert.equal((await call(`/api/admin/requests?kind=contact&q=${encodeURIComponent('РУССКОГО')}`)).total, 1)
  pass('Russian case-insensitive request search and callback inbox')
  const revisions = {}
  for (const collection of ['pages', 'blog', 'cases', 'materials', 'coatings', 'ralColors']) {
    let list = await call(`/api/admin/content/${collection}`)
    const item = structuredClone(list.items[0]); if ('title' in item) item.title += ' · QA'; else item.name += ' · QA'
    if ('body' in item) item.body += '<script>alert(1)</script><p onclick="evil()">Безопасный текст</p>'
    const oldRevision = list.revision
    list = await call(`/api/admin/content/${collection}`, 'POST', { action: 'save', item, id: item.id ?? item.code, revision: list.revision })
    if ('body' in item) assert.doesNotMatch(list.items[0].body, /script|onclick/)
    await call(`/api/admin/content/${collection}`, 'POST', { action: 'save', item, revision: oldRevision }, 409)
    list = await call(`/api/admin/content/${collection}`, 'POST', { action: 'archive', id: item.id ?? item.code, revision: list.revision })
    assert.equal(list.items.find(i => (i.id ?? i.code) === (item.id ?? item.code)).archived, true)
    list = await call(`/api/admin/content/${collection}`, 'POST', { action: 'restore', id: item.id ?? item.code, revision: list.revision })
    revisions[collection] = list.revision
  }
  pass('all CMS collections: edit, sanitize, conflict detection, archive and restore')
  let settings = await call('/api/admin/settings'); settings.settings.announcement = 'Проверено: подбор и поставка'; settings = await call('/api/admin/settings', 'PUT', settings)
  await call('/contact', 'GET', undefined, 200, {}).then(html => assert.match(html, /Проверено: подбор и поставка/))
  await call('/api/admin/settings', 'PUT', { ...settings, revision: 'stale' }, 409)
  const healthRes = await fetch(`${base}/api/admin/overview`, { headers: auth }); assert.match(healthRes.headers.get('cache-control'), /no-store/)
  const overview = await healthRes.json(); assert.equal(overview.business.orders.count, 1); assert.equal(overview.business.orders.requestedValue, 2000); assert.ok(overview.health.process.memory.rss > 0); assert.ok(overview.health.database.disk.freeBytes > 0); assert.ok(overview.health.database.readable)
  assert.doesNotMatch(JSON.stringify(overview), /qa@example|qa-site-session-secret|qa-testing-password/)
  const sitemap = await call('/sitemap.xml', 'GET', undefined, 200, {}); assert.match(sitemap, /qa-bench-25/); assert.doesNotMatch(sitemap, /qa-bench-26/); assert.match(sitemap, /blog\/kak-vybrat-lestnitsu/)
  await call('/api/admin/overview?from=2026-02-30&to=2026-03-01', 'GET', undefined, 400)
  pass('settings applied to storefront, real business totals and private server metrics')
  // Materials, coatings and RAL share one content document; snapshot after all edits.
  for (const collection of Object.keys(revisions)) revisions[collection] = (await call(`/api/admin/content/${collection}`)).revision
  await stop(); await start({ bootstrapAdmin: false })
  const persistedLogin = await call('/api/auth/login', 'POST', { email: 'qa-admin@example.com', password: 'qa-testing-password' }, 200, {})
  assert.equal(persistedLogin.user.id, loginUser.id)
  assert.equal(persistedLogin.user.role, 'admin')
  await call('/api/auth/login', 'POST', { email: 'qa-admin@example.com', password: 'wrong-password' }, 401, {})
  pass('persistent admin login after real server restart without bootstrap credentials')
  assert.equal((await call('/api/orders')).find(o => o.id === order.id).status, 'processing')
  assert.equal((await call('/api/admin/settings')).settings.announcement, settings.settings.announcement)
  for (const collection of Object.keys(revisions)) assert.equal((await call(`/api/admin/content/${collection}`)).revision, revisions[collection])
  const check = new DatabaseSync(databasePath, { readOnly: true }); assert.equal(check.prepare('PRAGMA quick_check').get().quick_check, 'ok'); check.close()
  pass('API → SQLite → reread after server restart, database integrity')
  mkdirSync('docs/qa', { recursive: true }); writeFileSync('docs/qa/api-results.json', JSON.stringify({ checkedAt: new Date().toISOString(), passed, production: false }, null, 2))
  if (process.env.QA_HOLD === '1') { console.log(`QA_BROWSER_URL=${base}; disposable fixtures only; QA login qa-admin@example.com / qa-testing-password`); await new Promise(() => {}) }
} finally {
  await stop()
  if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith('sib-trade-site-')) throw new Error('Unsafe cleanup')
  rmSync(directory, { recursive: true })
}

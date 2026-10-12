import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
const db = new DatabaseSync(resolve(process.env.SQLITE_DATABASE_PATH ?? 'data/catalog.sqlite'), { readOnly: true })
db.exec('PRAGMA busy_timeout=10000')
const catalog = JSON.parse(db.prepare("SELECT payload FROM app_state WHERE key='catalog'").get().payload)
const categoryIds = new Set(catalog.categories.map(c => c.id))
const slugs = [...catalog.products, ...catalog.categories, ...catalog.brands].map(i => i.slug)
const missingImages = new Set()
const lookup = db.prepare('SELECT 1 FROM catalog_media WHERE path=?')
for (const p of catalog.products) {
  for (const image of [...p.images, ...p.variants.flatMap(v => v.images)]) {
    if (image.url.startsWith('/api/catalog/media/')) {
      const path = image.url.slice('/api/catalog/media/'.length)
      if (!lookup.get(path.startsWith('images/products/') ? path : `uploads/${path}`)) missingImages.add(image.url)
    } else if (image.url.startsWith('/') && !existsSync(resolve(`public${image.url}`))) missingImages.add(image.url)
  }
}
console.log(JSON.stringify({ integrity: db.prepare('PRAGMA quick_check').get(), products: catalog.products.length, statuses: catalog.products.reduce((out, p) => { out[p.status] = (out[p.status] ?? 0) + 1; return out }, {}), categories: catalog.categories.length, duplicateSlugs: slugs.filter((s, i) => slugs.indexOf(s) !== i), orphanCategoryProducts: catalog.products.filter(p => p.categoryIds.some(id => !categoryIds.has(id))).length, noVariants: catalog.products.filter(p => !p.variants.length).length, missingImages: [...missingImages].slice(0, 20), missingImageCount: missingImages.size, orders: db.prepare('SELECT count(*) AS n FROM orders').get().n, requests: db.prepare('SELECT count(*) AS n FROM customer_requests').get().n }, null, 2))
db.close()

import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join, resolve } from "node:path"
import sharp from "sharp"

const apiRoot = process.env.SUPPLIER_CATALOG_API_ROOT?.trim().replace(/\/+$/, "")
if (!apiRoot) {
  throw new Error("Set SUPPLIER_CATALOG_API_ROOT to the catalog API base URL before running this importer.")
}
const apiOrigin = new URL(apiRoot).origin
const dataPath = resolve("src/data/products.json")
const brandId = "brand-supplied-products"
const rootCategoryId = "supplier-catalog-root"
const categoryId = (id) => `supplier-cat-${id}`
const groupId = (id) => `supplier-group-${id}`
const productId = (id) => `supplier-prod-${id}`
const imageDirectory = resolve("public/images/products/catalog")
const isCatalogMediaUrl = (url) => {
  try {
    return new URL(url).origin === apiOrigin
  } catch {
    return false
  }
}
const russianToLatin = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
}
const toLatinSlug = (value) => value.toLowerCase()
  .replace(/[а-яё]/g, (character) => russianToLatin[character] ?? "")
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
const sourceHostName = new URL(apiRoot).hostname.split(".").at(-2) ?? ""
const sourceBrandTerms = [...new Set([sourceHostName, toLatinSlug(sourceHostName)])].filter(Boolean)
const sourceBrandPattern = sourceBrandTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")

const categoryGroups = [
  { id: "furniture", name: "Городская и садовая мебель", slug: "gorodskaya-i-sadovaya-mebel", description: "Скамейки, столы, кресла, урны и мебель для общественных пространств." },
  { id: "playgrounds", name: "Детские площадки", slug: "detskie-ploshchadki", description: "Игровые комплексы, качели, горки и оборудование для детских площадок." },
  { id: "sports", name: "Спорт и активный отдых", slug: "sport-i-aktivnyy-otdykh", description: "Уличные тренажёры, воркаут и оборудование для спортивных площадок." },
  { id: "lighting", name: "Уличное освещение", slug: "ulichnoe-osveshchenie", description: "Светильники, опоры и ландшафтное освещение." },
  { id: "shelters", name: "Навесы и павильоны", slug: "navesy-i-pavilony", description: "Навесы, беседки, перголы и павильоны для общественных территорий." },
  { id: "landscaping", name: "Благоустройство и МАФ", slug: "blagoustroystvo-i-maf", description: "Элементы благоустройства, малые архитектурные формы и оборудование городской среды." },
  { id: "infrastructure", name: "Городская инфраструктура", slug: "gorodskaya-infrastruktura", description: "Ограждения, парковки, указатели и оборудование для городской среды." },
  { id: "other", name: "Другие товары", slug: "drugie-tovary", description: "Комплектующие и другие товары из каталога поставки." },
]

function categoryGroup(category) {
  const name = category.name.toLowerCase()
  if (/свет|освещ|фонар|торшер|бра/.test(name)) return "lighting"
  if (/детск|игров|качел|горк|песоч|батут|балансир|карусел|канатн|пространственн|препятств/.test(name)) return "playgrounds"
  if (/спортив|спорт|воркаут|тренаж|теннис|футболь|трибун|лыж|параворкаут/.test(name)) return "sports"
  if (/навес|пергол|павильон|беседк/.test(name)) return "shelters"
  if (/мебел|скам|кресл|стол|диван|лежак|шезлонг|пуф|урн|мангал|барбекю|дровниц|кухн|horeca|пивн|подушк|тент/.test(name)) return "furniture"
  if (/цветочниц|вазон|маф|благоустрой|топиар|реш[её]тк|пристволь|парклет|контейнерн|умный город|собак|буккроссинг/.test(name)) return "landscaping"
  if (/огражден|парковк|столбик|стенд|указател|корзин|вентиляцион|комплектующ|новинк|распродаж|сувенир/.test(name)) return "infrastructure"
  return "other"
}

function normalizeCategoryTree(catalog) {
  const groups = categoryGroups.map((group, index) => ({
    ...group,
    id: groupId(group.id),
    parentId: rootCategoryId,
    image: null,
    order: index + 1,
  }))
  const groupByKey = new Map(categoryGroups.map((group) => [group.id, group]))

  for (const category of catalog.categories) {
    if (category.id === rootCategoryId || category.id.startsWith("supplier-group-")) continue
    const group = groupByKey.get(categoryGroup(category))
    category.parentId = groupId(group.id)
  }

  for (const group of groups) {
    const example = catalog.categories.find((category) => category.parentId === group.id && category.image?.url)
    if (example) group.image = { ...example.image, alt: group.name }
  }
  return groups
}

async function saveImagesLocally(catalog) {
  const fallbackImage = catalog.products.find((item) =>
    item.id.startsWith("supplier-prod-") && item.images?.[0]?.url
  )?.images[0]
  if (fallbackImage) {
    for (const category of catalog.categories.filter((item) => item.id.startsWith("supplier-cat-") || item.id.startsWith("supplier-group-") || item.id === rootCategoryId)) {
      category.image ??= { ...fallbackImage, alt: category.name }
    }
  }

  const imageUrls = new Set()
  for (const product of catalog.products.filter((item) => item.id.startsWith("supplier-prod-"))) {
    for (const image of product.images ?? []) if (isCatalogMediaUrl(image.url)) imageUrls.add(image.url)
    for (const variant of product.variants ?? []) {
      for (const image of variant.images ?? []) if (isCatalogMediaUrl(image.url)) imageUrls.add(image.url)
    }
  }
  for (const category of catalog.categories.filter((item) => item.id.startsWith("supplier-cat-") || item.id.startsWith("supplier-group-") || item.id === rootCategoryId)) {
    if (category.image?.url && isCatalogMediaUrl(category.image.url)) imageUrls.add(category.image.url)
  }

  await mkdir(imageDirectory, { recursive: true })
  const entries = [...imageUrls]
  const localPaths = new Map()
  let completed = 0
  let nextIndex = 0
  const failed = []

  async function worker() {
    while (nextIndex < entries.length) {
      const index = nextIndex++
      const url = entries[index]
      const fileName = `${createHash("sha256").update(url).digest("hex").slice(0, 20)}.webp`
      const outputPath = join(imageDirectory, fileName)
      const publicPath = `/images/products/catalog/${fileName}`
      try {
        await access(outputPath)
      } catch {
        let lastError
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const response = await fetch(url, { headers: { accept: "image/*" } })
            if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const source = Buffer.from(await response.arrayBuffer())
            const optimized = await sharp(source)
              .rotate()
              .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
              .webp({ quality: 75, effort: 4 })
              .toBuffer()
            await writeFile(outputPath, optimized)
            lastError = undefined
            break
          } catch (error) {
            lastError = error
            await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * (attempt + 1)))
          }
        }
        if (lastError) {
          failed.push({ url, message: String(lastError) })
          continue
        }
      }
      localPaths.set(url, publicPath)
      completed += 1
      if (completed % 250 === 0 || completed === entries.length) {
        console.log(`Images: ${completed}/${entries.length} downloaded and optimized`)
      }
    }
  }

  await Promise.all(Array.from({ length: 16 }, worker))
  if (failed.length) {
    await writeFile(resolve("supplier-image-download-errors.json"), `${JSON.stringify(failed, null, 2)}\n`)
    throw new Error(`${failed.length} images could not be downloaded; see supplier-image-download-errors.json`)
  }

  const toLocal = (image) => ({ ...image, url: localPaths.get(image.url) ?? image.url })
  for (const product of catalog.products.filter((item) => item.id.startsWith("supplier-prod-"))) {
    product.images = (product.images ?? []).map(toLocal)
    for (const variant of product.variants ?? []) variant.images = (variant.images ?? []).map(toLocal)
  }
  for (const category of catalog.categories.filter((item) => item.id.startsWith("supplier-cat-") || item.id.startsWith("supplier-group-") || item.id === rootCategoryId)) {
    if (category.image) category.image = toLocal(category.image)
  }
  return entries.length
}

async function getJson(path) {
  let lastError
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${apiRoot}${path}${path.includes("?") ? "&" : "?"}agent=codex`, {
        headers: { accept: "application/json" },
      })
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Catalog API returned ${response.status}`)
      }
      if (!response.ok) throw new Error(`Catalog API returned ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * (attempt + 1)))
    }
  }
  throw lastError
}

async function getAll(path) {
  const items = []
  let cursor
  do {
    const params = new URLSearchParams({ limit: "100" })
    if (cursor) params.set("cursor", cursor)
    const page = await getJson(`${path}?${params}`)
    items.push(...page.data.items)
    cursor = page.meta.next_cursor
    console.log(`${path}: ${items.length} entries loaded`)
  } while (cursor)
  return items
}

function slugFromUrl(url, fallback, displayName) {
  const lastSegment = url ? new URL(url).pathname.split("/").filter(Boolean).at(-1) : ""
  const cleanName = displayName ? toLatinSlug(cleanProviderName(plainText(displayName))) : ""
  const sourceSlug = toLatinSlug(lastSegment || fallback).replace(/^catalog-/, "")
  if (cleanName && sourceSlug.startsWith(cleanName)) return `catalog-${cleanName}`
  const cleanSegment = sourceSlug.replace(new RegExp(`(?:^|-)${sourceBrandPattern}(?:-|$)`, "gi"), "-")
    .replace(/(?:^|-)s-logotipom-[^-]+/gi, "")
    .replace(/(?:^|-)brenda-[^-]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return `catalog-${cleanSegment || toLatinSlug(fallback)}`
}

function plainText(value) {
  if (Array.isArray(value)) value = value[0]
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim()
}

function cleanProviderName(value) {
  return value
    .replace(new RegExp(sourceBrandPattern, "gi"), "")
    .replace(/\s+(?:бренд(?:а)?|brand)\s+[^,.;]+/gi, "")
    .replace(/\s+(?:с\s+)?логотипом\s+\S+/gi, "")
    .replace(/«\s*»|"\s*"/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim()
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character])
}

function isoDate(value) {
  const timestamp = Date.parse(value ?? "")
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString()
}

const existingText = await readFile(dataPath, "utf8")
const catalog = JSON.parse(existingText)
if (process.argv.includes("--download-only")) {
  const count = await saveImagesLocally(catalog)
  await writeFile(dataPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  console.log(`Saved ${count} unique catalog images as local WebP files.`)
  process.exit(0)
}

const [sections, sourceProducts] = await Promise.all([
  getAll("/catalog/sections"),
  getAll("/catalog/products"),
])

const sourceProductBySection = new Map()
for (const item of sourceProducts) {
  const section = item.section?.id
  if (section && item.images?.[0] && !sourceProductBySection.has(section)) {
    sourceProductBySection.set(section, item)
  }
}

const sectionsById = new Map(sections.map((section) => [section.id, section]))
const imageBySection = new Map()
function findSectionImage(section) {
  if (imageBySection.has(section.id)) return imageBySection.get(section.id)
  const direct = sourceProductBySection.get(section.id)?.images?.[0]
  if (direct) {
    imageBySection.set(section.id, direct)
    return direct
  }
  const childImage = sections
    .filter((child) => child.parent_id === section.id)
    .map(findSectionImage)
    .find(Boolean)
  if (childImage) imageBySection.set(section.id, childImage)
  return childImage
}

const maxOrder = Math.max(0, ...catalog.categories.map((category) => category.order ?? 0))
const rootCategory = {
  id: rootCategoryId,
  name: "Уличное оборудование и благоустройство",
  slug: "ulichnoe-oborudovanie-i-blagoustroystvo",
  description: "Оборудование для парков, дворов, общественных пространств и загородных территорий. Подберём исполнение и организуем поставку.",
  image: null,
  order: maxOrder + 1,
}
const importedCategories = sections.map((section, index) => {
  const imageUrl = findSectionImage(section)
  const sourceDescription = cleanProviderName(plainText(section.description))
  const category = {
    id: categoryId(section.id),
    name: cleanProviderName(section.name),
    slug: slugFromUrl(section.canonical_url, section.code, section.name),
    description: sourceDescription || `Подбор ${cleanProviderName(section.name).toLowerCase()} с поставкой по России. Поможем уточнить исполнение и комплектность.`,
    image: imageUrl ? { url: imageUrl, alt: cleanProviderName(section.name) } : null,
    order: maxOrder + index + 1,
  }
  category.parentId = section.parent_id && sectionsById.has(section.parent_id)
    ? categoryId(section.parent_id)
    : rootCategoryId
  return category
})

const importedProducts = sourceProducts.map((item) => {
  const name = cleanProviderName(plainText(item.name)) || `Изделие ${item.id}`
  const sourceDescription = cleanProviderName(plainText(item.description))
  const description = sourceDescription || `${name}. Заказ и поставку оформляет Sib-Trade.`
  const features = (item.features ?? [])
    .filter((feature) => feature.code !== "description")
    .map((feature) => ({ name: cleanProviderName(plainText(feature.name)), value: cleanProviderName(plainText(feature.value)) }))
    .filter((feature) => feature.name && feature.value)
  const imageUrls = [...new Set((item.images ?? []).filter((url) => typeof url === "string" && isCatalogMediaUrl(url)))]
  const onRequest = item.price_status === "on_request" || !item.price || typeof item.price.value !== "number"
  const price = onRequest ? 0 : Math.round(item.price.value)
  const id = productId(item.id)
  const updatedAt = isoDate(item.updated_at)
  const archived = item.section?.id === 808
  const attributes = features.map(({ name: featureName, value }) =>
    `<dt>${escapeHtml(featureName)}</dt><dd>${escapeHtml(value)}</dd>`
  ).join("")
  const sourceLink = "<p>Подберём исполнение и организуем поставку по России.</p>"
  const body = [
    `<h2>${escapeHtml(name)}</h2>`,
    `<p>${escapeHtml(description)}</p>`,
    attributes ? `<dl>${attributes}</dl>` : "",
    sourceLink,
  ].filter(Boolean).join("")
  const variant = {
    id: `supplier-var-${item.id}`,
    productId: id,
    sku: cleanProviderName(plainText(item.article)) || `SUP-${item.id}`,
    name: name,
    price,
    ...(onRequest ? { priceOnRequest: true } : {}),
    currency: item.price?.currency || "RUB",
    inventory: { quantity: 0, trackInventory: false, allowBackorder: true },
    options: features.slice(0, 3).map(({ name: optionName, value }) => ({ name: optionName, value })),
    images: imageUrls.map((url, index) => ({ url, alt: `${name}${index ? ` — изображение ${index + 1}` : ""}` })),
  }

  return {
    id,
    name,
    slug: slugFromUrl(item.canonical_url, `product-${item.id}`, item.name),
    description,
    body,
    images: imageUrls.map((url, index) => ({ url, alt: `${name}${index ? ` — изображение ${index + 1}` : ""}` })),
    status: archived ? "archived" : "active",
    brandId,
    categoryIds: sectionsById.has(item.section?.id) ? [categoryId(item.section.id)] : [],
    tags: ["поставка", ...features.slice(0, 5).map(({ name: featureName }) => cleanProviderName(featureName))].filter(Boolean),
    variants: [variant],
    featured: false,
    createdAt: updatedAt,
    updatedAt,
    rating: 0,
    reviewCount: 0,
  }
})

rootCategory.image = importedProducts.find((product) => product.images[0])?.images[0] ?? null
catalog.categories = [
  ...catalog.categories.filter((category) =>
    !category.id.startsWith("supplier-cat-") &&
    !category.id.startsWith("supplier-group-") &&
    category.id !== rootCategoryId
  ),
  rootCategory,
  ...importedCategories,
]
catalog.categories = [...normalizeCategoryTree(catalog), ...catalog.categories]
catalog.products = [...catalog.products.filter((product) => !product.id.startsWith("supplier-prod-")), ...importedProducts]
catalog.brands = [
  ...catalog.brands.filter((brand) => brand.id !== brandId),
  {
    id: brandId,
    name: "Поставка оборудования",
    slug: "postavka-oborudovaniya",
    description: "Подбор комплектации, проверка характеристик и организация поставки оборудования.",
  },
]

const imageCount = await saveImagesLocally(catalog)
await writeFile(dataPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
console.log(`Imported ${importedProducts.length} products, ${importedCategories.length} categories and saved ${imageCount} unique images locally.`)

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { DatabaseSync } from "node:sqlite"
import { resolve } from "node:path"

const databasePath = resolve("data/catalog.sqlite")
const db = new DatabaseSync(databasePath)
db.exec("PRAGMA busy_timeout = 10000")
const row = db.prepare("SELECT payload FROM app_state WHERE key = 'catalog'").get()
if (!row) throw new Error("Не найдена активная база каталога data/catalog.sqlite")

const currentCatalog = JSON.parse(row.payload)
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))
const catalog = sourceArgument
  ? JSON.parse(await readFile(resolve(sourceArgument.slice("--source=".length)), "utf8"))
  : currentCatalog
const clean = (value = "") => String(value)
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/\s+/g, " ")
  .trim()
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character])

function getDimensions(product) {
  const text = clean(`${product.description ?? ""} ${product.body ?? ""}`)
  const dimensions = new Map()
  const pattern = /(?:^|[\s,;])\s*(длина|ширина|высота|диаметр|объ[её]м)\s*:?\s*([\d.,]+)\s*(мм|см|м|л(?:итров?)?)(?=$|[\s.,;])/gi
  for (const match of text.matchAll(pattern)) {
    const label = match[1].toLocaleLowerCase("ru-RU").replace("ё", "е")
    if (!dimensions.has(label)) dimensions.set(label, { label, value: match[2], unit: match[3] })
  }
  const order = ["длина", "ширина", "высота", "диаметр", "объем"]
  return [...dimensions.values()].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}

function getPurpose(product, categoryNames) {
  const keywords = `${product.name} ${(product.tags ?? []).join(" ")} ${categoryNames.join(" ")}`.toLocaleLowerCase("ru-RU")
  if (/анкер|крепеж|крепёж|закладн/.test(keywords)) return "монтажа и установки уличной мебели"
  if (/кормуш|животновод|крс|ферм/.test(keywords)) return "оснащения животноводческого хозяйства"
  if (/светильник|фонарь|освещ|опора освещ/.test(keywords)) return "наружного освещения и благоустройства территории"
  if (/раздевал|спортзал|спорт|тренаж|воркаут/.test(keywords)) return "спортивных залов и площадок"
  if (/топиари|арт.?объект|декор/.test(keywords)) return "оформления общественных и коммерческих пространств"
  if (/детск|игров|горк|песоч|качел.{0,20}детск/.test(keywords)) return "детских игровых площадок"
  if (/качел/.test(keywords)) return "благоустройства парков и зон отдыха"
  if (/навес|пергол|павильон|беседк/.test(keywords)) return "обустройства и защиты общественных зон"
  if (/ограж|забор|парковк|велопарков|инфраструктур/.test(keywords)) return "городской инфраструктуры и общественных пространств"
  if (/скам|лавоч|урн|стол|кресл|парк|благоустройств|маф/.test(keywords)) return "благоустройства парков, дворов и общественных пространств"
  return "комплектации объектов по назначению"
}

function makeTitle(product, dimensions) {
  const current = clean(product.name)
  const keywords = `${product.name} ${(product.tags ?? []).join(" ")} ${(product.categoryIds ?? []).map((id) => catalog.categories.find((category) => category.id === id)?.name ?? "").join(" ")}`.toLocaleLowerCase("ru-RU")
  const length = dimensions.find((item) => item.label === "длина")
  const diameter = dimensions.find((item) => item.label === "диаметр" || item.label === "объем")
  const verticalProduct = /светильник|фонарь|опора|ограж|качел|стойк|пергол/.test(keywords)
  const secondaryLabel = verticalProduct ? "высота" : "ширина"
  const primary = length ?? diameter
  const secondary = dimensions.find((item) => item.label === secondaryLabel && item.unit === primary?.unit)
  const numericModelNumber = current.match(/(?:^|\s)(\d{3,5})(?=\s|$)/)?.[1]
  const baseTitle = primary && numericModelNumber === primary.value ? `${current} ${primary.unit}` : current
  const alreadyShowsPrimary = primary && new RegExp(`${primary.value}\\s*${primary.unit}`, "i").test(baseTitle)
  const additions = [alreadyShowsPrimary ? null : primary, secondary]
    .filter((item) => item && !new RegExp(`${item.value}\\s*${item.unit}`, "i").test(baseTitle))
  if (additions.length && dimensions.length) {
    const labels = additions.map((item) => item.label[0].toLocaleUpperCase("ru-RU")).join("×")
    const values = additions.map((item) => item.value).join(" × ")
    const suffix = ` · ${labels} ${values} ${additions[0].unit}`
    if (baseTitle.length + suffix.length <= 96) return `${baseTitle}${suffix}`
  }

  if (baseTitle !== current) return baseTitle
  if (current.length < 54) {
    const application = /топиари|арт.?объект|декор/.test(keywords) ? "для оформления пространств"
      : /кормуш|животновод|крс|ферм/.test(keywords) ? "для хозяйства"
        : /светильник|фонарь|освещ/.test(keywords) ? "для наружного освещения"
          : /раздевал|спортзал|спорт|тренаж|воркаут/.test(keywords) ? "для спорта и отдыха"
            : /детск|игров|горк|песоч/.test(keywords) ? "для игровых площадок"
              : /навес|пергол|павильон|беседк/.test(keywords) ? "для общественных зон"
                : /ограж|забор|парковк|велопарков|инфраструктур/.test(keywords) ? "для городской среды"
                  : /скам|лавоч|урн|стол|кресл|парк|благоустройств|маф/.test(keywords) ? "для парков и дворов"
                    : null
    if (application && !keywords.includes(application.slice(4, 10)) && current.length + application.length + 3 <= 88) return `${current} — ${application}`
  }
  return current
}

function makeDescription(product, title, purpose, dimensions) {
  const sizeText = dimensions.map(({ label, value, unit }) => `${label} — ${value} ${unit}`).join("; ")
  const sourceText = clean(`${product.description ?? ""} ${product.body ?? ""}`).toLocaleLowerCase("ru-RU")
  const materials = [
    ["нержавеющая сталь", /нержавеющ.*сталь/],
    ["лиственница", /лиственниц/],
    ["ангарская сосна", /ангарск.{0,12}сосн/],
    ["чугун", /чугун/],
    ["робиния", /робини/],
    ["поликарбонат", /поликарбонат/],
    ["фанера ФСФ", /фанер.{0,12}фсф/],
    ["бетон", /бетон/],
    ["дерево", /деревянн|дерево/],
    ["металл", /металлическ|металл|профильная труба|сталь/],
  ].filter(([, pattern]) => pattern.test(sourceText)).map(([material]) => material).slice(0, 2)
  const facts = [
    sizeText ? `Размеры по карточке поставщика: ${sizeText}.` : "",
    materials.length ? `Материал по карточке: ${materials.join(" и ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
  const displayTitle = title.replace(/[«»]/g, "").trim()
  return `В каталоге СИБ-ТРЕЙД представлена модель «${displayTitle}» для ${purpose}.${facts ? ` ${facts}` : ""} Поможем уточнить комплектность и организуем поставку.`
}

function readFeaturePairs(body = "") {
  const pairs = []
  const pattern = /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi
  for (const match of body.matchAll(pattern)) {
    const name = clean(match[1])
    const value = clean(match[2])
    if (name && value && !/описание/i.test(name)) pairs.push([name, value])
  }
  return pairs
}

function readUsefulParagraphs(product) {
  const oldDescription = clean(product.description).toLocaleLowerCase("ru-RU")
  const paragraphs = [...String(product.body ?? "").matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => clean(match[1]))
  return paragraphs.filter((text) => {
    const normalized = text.toLocaleLowerCase("ru-RU")
    if (!text || normalized === oldDescription || /подбер[её]м исполнение|организуем поставку|заказ и поставку оформляет/i.test(text)) return false
    return /\d\s*(?:мм|см|м|л|кг|кн|вт|в|шт)|зона безопасности|материал|каркас|опор|перекладин|покрыти|цвет|нагрузк|сертификат/i.test(text)
  })
}

function makeBody(product, title, description, dimensions) {
  const pairs = readFeaturePairs(product.body)
  const existingFacts = readUsefulParagraphs(product)
  const dimensionLabels = new Set(dimensions.map((item) => item.label))
  const generatedDimensionPairs = dimensions
    .filter((item) => !pairs.some(([label]) => label.toLocaleLowerCase("ru-RU").startsWith(item.label)))
    .map((item) => [item.label[0].toLocaleUpperCase("ru-RU") + item.label.slice(1), `${item.value} ${item.unit}`])
  const featureHtml = [...pairs, ...generatedDimensionPairs]
    .map(([name, value]) => `<dt>${escapeHtml(name)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("")
  const paragraphs = [...new Set(existingFacts)]
    .filter((text) => /зона безопасности/i.test(text) || !dimensions.length || ![...dimensionLabels].some((label) => new RegExp(`(?:^|[\\s,;])${label}\\s*:`, "i").test(text)))
    .map((text) => `<p>${escapeHtml(text)}</p>`)
    .join("")

  return [`<h2>${escapeHtml(title)}</h2>`, `<p>${escapeHtml(description)}</p>`, featureHtml ? `<dl>${featureHtml}</dl>` : "", paragraphs]
    .filter(Boolean)
    .join("")
}

const products = catalog.products
const plans = products.map((product) => {
  const dimensions = getDimensions(product)
  const title = makeTitle(product, dimensions)
  const categoryNames = (product.categoryIds ?? [])
    .map((id) => catalog.categories.find((category) => category.id === id)?.name)
    .filter(Boolean)
  const purpose = getPurpose(product, categoryNames)
  const description = makeDescription(product, title, purpose, dimensions)
  const body = makeBody(product, title, description, dimensions)
  return { product, title, description, body }
})

const renamed = plans.filter(({ product, title }) => product.name !== title).length
const rewrittenDescriptions = plans.filter(({ product, description }) => clean(product.description) !== description).length
const preview = plans.filter(({ product }) => product.status === "active").slice(0, 12)
console.log(JSON.stringify({
  mode: process.argv.includes("--apply") ? "apply" : "preview",
  total: products.length,
  active: products.filter((product) => product.status === "active").length,
  titlesEnriched: renamed,
  descriptionsRewritten: rewrittenDescriptions,
  preview: preview.map(({ product, title, description, body }) => ({ before: product.name, after: title, description, body: body.slice(0, 320) })),
}, null, 2))

if (!process.argv.includes("--apply")) {
  db.close()
  process.exit(0)
}

const backupDirectory = resolve("data/catalog-backups")
await mkdir(backupDirectory, { recursive: true })
const backupPath = resolve(backupDirectory, `catalog-before-copy-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  await writeFile(backupPath, `${JSON.stringify(currentCatalog)}\n`, "utf8")

db.exec("BEGIN IMMEDIATE")
try {
  for (const { product, title, description, body } of plans) {
    product.name = title
    product.description = description
    product.body = body
    product.images = (product.images ?? []).map((image, index) => ({ ...image, alt: `${title} — фотография ${index + 1}` }))
    product.variants = (product.variants ?? []).map((variant) => ({
      ...variant,
      images: (variant.images ?? []).map((image, index) => ({ ...image, alt: `${title} — фотография ${index + 1}` })),
    }))
  }
  db.prepare("UPDATE app_state SET payload = ? WHERE key = 'catalog'").run(JSON.stringify(catalog))
  db.exec("COMMIT")
} catch (error) {
  db.exec("ROLLBACK")
  throw error
} finally {
  db.close()
}

console.log(JSON.stringify({ applied: products.length, backupPath }))

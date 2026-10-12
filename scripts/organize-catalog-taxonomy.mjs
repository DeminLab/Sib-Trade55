import fs from "node:fs/promises"
import path from "node:path"

const files = ["src/data/products.json", "data/catalog.json"]
const rootId = "supplier-catalog-root"

function organize(data) {
  const categories = data.categories
  const byId = new Map(categories.map((category) => [category.id, category]))
  const root = byId.get(rootId)
  if (!root) return false

  const find = (id) => byId.get(id)
  const setParent = (id, parentId, order) => {
    const category = find(id)
    if (!category) return
    category.parentId = parentId
    if (order !== undefined) category.order = order
  }

  const metalwork = find("cat-1")
  if (metalwork) {
    metalwork.name = "Металлоконструкции"
    metalwork.description = "Лестницы, ограждения, козырьки и другие металлические конструкции для объектов и общественных пространств."
    setParent(metalwork.id, rootId, 1)
    setParent("cat-1-1", metalwork.id, 1)
    setParent("cat-1-2", metalwork.id, 2)
    setParent("cat-1-3", "supplier-group-shelters", 3)
  }

  const benches = find("supplier-cat-408")
  if (benches) {
    benches.name = "Скамейки"
    benches.description = "Парковые, садовые и уличные скамейки для дворов, парков и общественных пространств."
    setParent(benches.id, rootId, 2)
    setParent("supplier-cat-333", benches.id, 1)
    setParent("supplier-cat-339", benches.id, 2)
  }

  const bins = find("supplier-cat-411")
  if (bins) {
    bins.name = "Урны и мусорные контейнеры"
    bins.description = "Уличные урны и решения для сбора отходов на территориях и в общественных пространствах."
    setParent(bins.id, rootId, 3)
  }

  let art = find("catalog-family-art")
  if (!art) {
    const sampleImage = find("cat-new-101")?.image ?? find("cat-new-105")?.image ?? null
    art = {
      id: "catalog-family-art",
      name: "Арт-объекты и фигуры",
      slug: "art-obekty-i-figury",
      description: "Декоративные фигуры и арт-объекты для парков, улиц и общественных пространств.",
      image: sampleImage,
      order: 4,
      parentId: rootId,
    }
    categories.push(art)
    byId.set(art.id, art)
  }
  art.name = "Арт-объекты и фигуры"
  art.description = "Декоративные фигуры и арт-объекты для парков, улиц и общественных пространств."
  setParent(art.id, rootId, 4)

  const shelters = find("supplier-group-shelters")
  if (shelters) {
    shelters.name = "Павильоны, навесы и перголы"
    shelters.description = "Павильоны, теневые навесы, беседки и перголы для парков, дворов и загородных территорий."
    setParent(shelters.id, rootId, 5)
  }

  const swings = find("supplier-cat-839")
  if (swings) {
    swings.name = "Парковые качели"
    swings.description = "Качели для парков, скверов, дворов и зон отдыха."
    setParent(swings.id, rootId, 6)
    setParent("supplier-cat-1405", swings.id, 1)
  }

  const topiary = find("cat-new-101")
  if (topiary) setParent(topiary.id, art.id, 1)
  const metalFigures = find("cat-new-105")
  if (metalFigures) setParent(metalFigures.id, art.id, 2)

  // Put categories about covered outdoor structures together, even when the
  // source import originally grouped them with playground equipment.
  for (const category of categories) {
    if (category.id === shelters?.id || category.id === "cat-1-3") continue
    if (/^(павильоны для курения|беседки|уличные навесы|перголы|перголы и шпалеры|теневые навесы для детского сада)$/i.test(category.name.trim())) {
      category.parentId = shelters?.id ?? category.parentId
    }
  }

  // These product groups describe metal street structures and fixtures.
  for (const id of ["supplier-cat-306", "supplier-cat-1425", "supplier-cat-2157"]) {
    if (metalwork && find(id)) find(id).parentId = metalwork.id
  }

  // Keep the broader catalog directions, but make their order follow the
  // product families customers are most likely to look for first.
  const orders = new Map([
    ["supplier-group-furniture", 7],
    ["supplier-group-playgrounds", 8],
    ["supplier-group-sports", 9],
    ["supplier-group-lighting", 10],
    ["supplier-group-landscaping", 11],
    ["supplier-group-infrastructure", 12],
    ["supplier-group-other", 13],
  ])
  for (const [id, order] of orders) setParent(id, rootId, order)

  categories.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ru"))
  return true
}

for (const relativePath of files) {
  const filePath = path.resolve(relativePath)
  let source
  try {
    source = await fs.readFile(filePath, "utf8")
  } catch (error) {
    if (error.code === "ENOENT") continue
    throw error
  }

  const data = JSON.parse(source)
  if (!organize(data)) continue
  const temporaryPath = `${filePath}.tmp`
  await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8")
  await fs.rename(temporaryPath, filePath)
  console.log(`Updated category hierarchy in ${relativePath}`)
}

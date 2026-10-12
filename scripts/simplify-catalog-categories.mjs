import { copyFile, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const apply = process.argv.includes("--apply")
const collectionIds = new Set(["supplier-cat-383", "supplier-cat-1416"])

const taxonomy = [
  { id: "supplier-catalog-root", name: "Уличное оборудование и благоустройство", slug: "ulichnoe-oborudovanie-i-blagoustroystvo", order: 0 },
  { id: "supplier-group-furniture", name: "Скамейки и уличная мебель", slug: "skameyki-i-ulichnaya-mebel", parentId: "supplier-catalog-root", order: 10 },
  { id: "supplier-cat-333", name: "Скамейки и сиденья", slug: "skameyki-i-sidenya", parentId: "supplier-group-furniture", order: 10, group: "furniture", bucket: "benches" },
  { id: "supplier-cat-301", name: "Столы, кресла и комплекты мебели", slug: "stoly-kresla-komplekty-mebeli", parentId: "supplier-group-furniture", order: 20, group: "furniture", bucket: "sets" },
  { id: "supplier-cat-396", name: "Мангалы, кухни и оборудование для отдыха", slug: "mangaly-kuhni-oborudovanie-otdyha", parentId: "supplier-group-furniture", order: 30, group: "furniture", bucket: "bbq" },
  { id: "supplier-cat-1405", name: "Качели и мебель для отдыха", slug: "kacheli-mebel-otdyha", parentId: "supplier-group-furniture", order: 40, group: "furniture", bucket: "leisure" },
  { id: "supplier-cat-411", name: "Урны и контейнеры", slug: "urny-i-konteynery", parentId: "supplier-catalog-root", order: 20 },
  { id: "supplier-group-playgrounds", name: "Детские площадки и игры", slug: "detskie-ploshchadki-i-igry", parentId: "supplier-catalog-root", order: 30 },
  { id: "supplier-cat-326", name: "Игровые комплексы и площадки", slug: "igrovye-kompleksy-i-ploshchadki", parentId: "supplier-group-playgrounds", order: 10, group: "playgrounds", bucket: "complexes" },
  { id: "supplier-cat-774", name: "Качели, горки и игровые элементы", slug: "kacheli-gorki-igrovye-elementy", parentId: "supplier-group-playgrounds", order: 20, group: "playgrounds", bucket: "elements" },
  { id: "supplier-cat-1380", name: "Батуты, сетки и полосы препятствий", slug: "batuty-setki-polosy-prepyatstviy", parentId: "supplier-group-playgrounds", order: 30, group: "playgrounds", bucket: "active" },
  { id: "supplier-cat-773", name: "Игры с водой и песком", slug: "igry-s-vodoy-i-peskom", parentId: "supplier-group-playgrounds", order: 40, group: "playgrounds", bucket: "water" },
  { id: "supplier-group-sports", name: "Спорт и активный отдых", slug: "sport-i-aktivnyy-otdykh", parentId: "supplier-catalog-root", order: 40 },
  { id: "supplier-cat-786", name: "Тренажёры и воркаут", slug: "trenazhery-i-vorkaut", parentId: "supplier-group-sports", order: 10, group: "sports", bucket: "workout" },
  { id: "supplier-cat-2132", name: "Спортивные площадки", slug: "sportivnye-ploshchadki", parentId: "supplier-group-sports", order: 20, group: "sports", bucket: "courts" },
  { id: "supplier-cat-824", name: "Спортивное оборудование", slug: "sportivnoe-oborudovanie", parentId: "supplier-group-sports", order: 30, group: "sports", bucket: "equipment" },
  { id: "supplier-group-lighting", name: "Уличное освещение", slug: "ulichnoe-osveshchenie", parentId: "supplier-catalog-root", order: 50 },
  { id: "supplier-cat-309", name: "Светильники и фонари", slug: "svetilniki-i-fonari", parentId: "supplier-group-lighting", order: 10, group: "lighting", bucket: "fixtures" },
  { id: "supplier-cat-797", name: "Опоры и аксессуары освещения", slug: "opory-i-aksessuary-osveshcheniya", parentId: "supplier-group-lighting", order: 20, group: "lighting", bucket: "supports" },
  { id: "supplier-cat-765", name: "Ландшафтное и декоративное освещение", slug: "landshaftnoe-i-dekorativnoe-osveshchenie", parentId: "supplier-group-lighting", order: 30, group: "lighting", bucket: "decorative" },
  { id: "supplier-group-shelters", name: "Навесы, павильоны и беседки", slug: "navesy-pavilony-besedki", parentId: "supplier-catalog-root", order: 60 },
  { id: "supplier-cat-1407", name: "Навесы и перголы", slug: "navesy-i-pergoly", parentId: "supplier-group-shelters", order: 10, group: "shelters", bucket: "canopies" },
  { id: "supplier-cat-2155", name: "Беседки", slug: "besedki", parentId: "supplier-group-shelters", order: 20, group: "shelters", bucket: "gazebos" },
  { id: "supplier-cat-2128", name: "Павильоны и уличные кабины", slug: "pavilony-i-ulichnye-kabiny", parentId: "supplier-group-shelters", order: 30, group: "shelters", bucket: "pavilions" },
  { id: "supplier-group-landscaping", name: "Благоустройство и городская среда", slug: "blagoustroystvo-i-gorodskaya-sreda", parentId: "supplier-catalog-root", order: 70 },
  { id: "supplier-cat-304", name: "Цветочницы, вазоны и озеленение", slug: "tsvetochnitsy-vazony-ozelenenie", parentId: "supplier-group-landscaping", order: 10, group: "landscape", bucket: "greenery" },
  { id: "supplier-cat-315", name: "Городская инфраструктура и благоустройство", slug: "gorodskaya-infrastruktura-blagoustroystvo", parentId: "supplier-group-landscaping", order: 20, group: "landscape", bucket: "urban" },
  { id: "catalog-family-art", name: "Арт-объекты и оформление", slug: "art-obekty-i-oformlenie", parentId: "supplier-group-landscaping", order: 30, group: "landscape", bucket: "art" },
  { id: "cat-1", name: "Металлоконструкции", slug: "metallokonstruktsii", parentId: "supplier-catalog-root", order: 80 },
  { id: "cat-1-2", name: "Ворота, заборы и ограждения", slug: "vorota-zabory-ograzhdeniya", parentId: "cat-1", order: 10, group: "metal", bucket: "fences" },
  { id: "cat-1-1", name: "Лестницы и металлоизделия", slug: "lestnitsy-i-metalloizdeliya", parentId: "cat-1", order: 20, group: "metal", bucket: "stairs" },
  { id: "supplier-cat-1425", name: "Технические металлические конструкции", slug: "tekhnicheskie-metallicheskie-konstruktsii", parentId: "cat-1", order: 30, group: "metal", bucket: "technical" },
  { id: "supplier-cat-383", name: "Распродажа", slug: "catalog-rasprodazha-parkovoy-sadovoy-i-dachnoy-mebeli", parentId: "supplier-catalog-root", order: 90 },
  { id: "supplier-cat-1416", name: "Новинки", slug: "catalog-novinki", parentId: "supplier-catalog-root", order: 100 },
]

const targets = new Map(taxonomy.map((category) => [category.id, category]))

function categoryPath(category, byId) {
  const parts = []
  let current = category
  while (current) {
    parts.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return parts
}

function classifyCategory(category, byId) {
  if (collectionIds.has(category.id)) return category.id
  if (category.id === "supplier-catalog-root") return "supplier-catalog-root"
  if (targets.has(category.id) && targets.get(category.id).group) return category.id
  if (targets.has(category.id) && !targets.get(category.id).group) return category.id

  const pathNames = categoryPath(category, byId).map((item) => item.name).join(" ").toLocaleLowerCase("ru-RU")
  const name = category.name.toLocaleLowerCase("ru-RU")
  let group
  if (pathNames.includes("металлоконструкции")) group = "metal"
  else if (pathNames.includes("урны и мусорные контейнеры")) return "supplier-cat-411"
  else if (pathNames.includes("городская и садовая мебель") || pathNames.includes("скамейки") || pathNames.includes("парковые качели")) group = "furniture"
  else if (pathNames.includes("детские площадки") || /детск|песочниц|водой и песком|качалк.*пружин/.test(pathNames)) group = "playgrounds"
  else if (pathNames.includes("спорт и активный отдых")) group = "sports"
  else if (pathNames.includes("уличное освещение")) group = "lighting"
  else if (pathNames.includes("павильоны, навесы и перголы")) group = "shelters"
  else if (pathNames.includes("благоустройство и маф") || pathNames.includes("городская инфраструктура") || pathNames.includes("арт-объекты и фигуры")) group = "landscape"
  else if (pathNames.includes("другие товары")) group = /животновод|кормушк|поилк/.test(pathNames) ? "landscape" : "playgrounds"
  else if (/урн|мусорн.*контейнер|пепельниц/.test(name)) return "supplier-cat-411"
  else if (/фонар|светильник|опор.*свет|освещ/.test(name)) group = "lighting"
  else if (/скамейк|скамь|лавк|мангал|барбекю/.test(name)) group = "furniture"
  else if (/детск|игров|качел|песочниц|батут/.test(name)) group = "playgrounds"
  else if (/спорт|тренажер|воркаут|теннис|трибун/.test(name)) group = "sports"
  else if (/навес|пергол|беседк|павильон/.test(name)) group = "shelters"
  else if (/забор|огражден|лестниц|ворот|металл/.test(name)) group = "metal"
  else group = "landscape"

  if (group === "furniture") {
    if (/скамейк|скамь|лавк|банкетк|сидень/.test(name)) return "supplier-cat-333"
    if (/мангал|барбекю|дровниц|угольниц|кухн/.test(name)) return "supplier-cat-396"
    if (/качел|шезлонг|лежак/.test(name)) return "supplier-cat-1405"
    return "supplier-cat-301"
  }
  if (group === "playgrounds") {
    if (/водой|песком|пружин/.test(name)) return "supplier-cat-773"
    if (/батут|сетка|канат|препятств/.test(name)) return "supplier-cat-1380"
    if (/комплекс|научн.*площад|площадк/.test(name)) return "supplier-cat-326"
    return "supplier-cat-774"
  }
  if (group === "sports") {
    if (/тренажер|воркаут|параворкаут/.test(name)) return "supplier-cat-786"
    if (/площадк/.test(name)) return "supplier-cat-2132"
    return "supplier-cat-824"
  }
  if (group === "lighting") {
    if (/опор|кронштейн|цокол|бра настенн/.test(name)) return "supplier-cat-797"
    if (/ландшафт|оформлен|декоратив/.test(name)) return "supplier-cat-765"
    return "supplier-cat-309"
  }
  if (group === "shelters") {
    if (/беседк|ротонд/.test(name)) return "supplier-cat-2155"
    if (/курен|павильон|кабин/.test(name)) return "supplier-cat-2128"
    return "supplier-cat-1407"
  }
  if (group === "landscape") {
    if (/арт|топиар|фигур|скульптур|монумент|стелл|сувенир/.test(name)) return "catalog-family-art"
    if (/цветоч|вазон|кашпо|пристволь|решетк.*дерев/.test(name)) return "supplier-cat-304"
    return "supplier-cat-315"
  }
  if (group === "metal") {
    if (/лестниц/.test(name)) return "cat-1-1"
    if (/корзин.*кондиционер|вентиляц|техническ/.test(name)) return "supplier-cat-1425"
    return "cat-1-2"
  }
  return "supplier-cat-411"
}

function simplify(data) {
  const oldById = new Map(data.categories.map((category) => [category.id, category]))
  const categoryMap = new Map(data.categories.map((category) => [category.id, classifyCategory(category, oldById)]))
  const unknownAssignments = new Set()
  let changedProducts = 0
  let remappedAssignments = 0

  for (const product of data.products) {
    const next = []
    for (const id of product.categoryIds ?? []) {
      const mapped = categoryMap.get(id)
      if (!mapped) {
        unknownAssignments.add(id)
        continue
      }
      if (mapped === "supplier-catalog-root") continue
      if (mapped !== id) remappedAssignments += 1
      if (!next.includes(mapped)) next.push(mapped)
    }
    if (!next.length) next.push("supplier-cat-315")
    if (JSON.stringify(next) !== JSON.stringify(product.categoryIds)) {
      product.categoryIds = next
      changedProducts += 1
    }
  }

  const categories = taxonomy.map((category) => {
    const original = oldById.get(category.id)
    const { group: _group, bucket: _bucket, ...record } = category
    const description = category.id === "supplier-catalog-root"
      ? original?.description ?? "Подбираем оборудование для благоустройства и организуем поставку по России."
      : category.id === "supplier-cat-383"
        ? "Товары из каталога по специальным ценам."
        : category.id === "supplier-cat-1416"
          ? "Новые товары в каталоге."
          : original?.description ?? "Подбор оборудования и поставка по России."
    const image = original?.image
    return { ...record, description, ...(image ? { image: { ...image, alt: category.name } } : {}) }
  })
  data.categories = categories

  const counts = new Map(categories.map((category) => [category.id, 0]))
  for (const product of data.products) {
    for (const id of product.categoryIds) {
      let category = categories.find((item) => item.id === id)
      while (category) {
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1)
        category = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined
      }
    }
  }
  return { changedProducts, remappedAssignments, unknownAssignments: [...unknownAssignments], counts, categories }
}

const files = ["data/catalog.json", "src/data/products.json"]
for (const relativePath of files) {
  const filePath = path.resolve(root, relativePath)
  const data = JSON.parse(await readFile(filePath, "utf8"))
  const result = simplify(data)
  console.log(`${relativePath}: ${result.categories.length} categories; ${result.changedProducts} products updated; ${result.remappedAssignments} category links remapped`)
  for (const category of result.categories.filter((item) => item.parentId === "supplier-catalog-root")) {
    console.log(`  ${category.name}: ${result.counts.get(category.id)} products`)
  }
  if (result.unknownAssignments.length) console.log(`  Unknown category IDs: ${result.unknownAssignments.join(", ")}`)
  if (!apply) continue

  const backupPath = path.resolve(root, "data", `${path.basename(filePath)}.before-simplification.bak`)
  if (relativePath === "data/catalog.json" || relativePath === "src/data/products.json") {
    await copyFile(filePath, backupPath)
    console.log(`  Backup: ${path.relative(root, backupPath)}`)
  }
  const temporaryPath = `${filePath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8")
  await rename(temporaryPath, filePath)
}

if (!apply) console.log("Dry run only. Pass --apply to save changes.")

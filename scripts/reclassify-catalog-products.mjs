import fs from "node:fs/promises"
import path from "node:path"

const targets = new Set([
  "supplier-cat-808", // legacy archive bucket; status remains archived
  "supplier-cat-383", // sale is a merchandising label, not a product type
  "supplier-cat-1416", // new products is a merchandising label
  "cat-new-102", // legacy mixed street furniture bucket
  "cat-new-103", // legacy mixed housing and landscaping bucket
])

const ids = {
  benches: "supplier-cat-408",
  gardenBenches: "supplier-cat-339",
  streetBenches: "supplier-cat-333",
  bins: "supplier-cat-411",
  lighting: "supplier-cat-309",
  steelLighting: "supplier-cat-322",
  retroLighting: "supplier-cat-319",
  lightingAccessories: "supplier-cat-341",
  lightingPosts: "supplier-cat-797",
  flowers: "supplier-cat-304",
  bikeParking: "supplier-cat-315",
  bollards: "supplier-cat-306",
  fences: "cat-1-2",
  metalwork: "cat-1",
  playgrounds: "supplier-cat-773",
  playgroundComplexes: "supplier-cat-326",
  swings: "supplier-cat-839",
  childSwings: "supplier-cat-774",
  springRiders: "supplier-cat-1457",
  waterPlay: "supplier-cat-1455",
  sport: "supplier-cat-781",
  workout: "supplier-cat-788",
  stands: "supplier-cat-824",
  tennis: "supplier-cat-1365",
  football: "supplier-cat-1445",
  shelters: "supplier-cat-805",
  gazebos: "supplier-cat-2155",
  pergolas: "supplier-cat-1408",
  canopies: "supplier-cat-1407",
  smokingPavilions: "supplier-cat-2128",
  furnitureSets: "supplier-cat-301",
  gardenTables: "supplier-cat-302",
  streetTables: "supplier-cat-331",
  gardenChairs: "supplier-cat-303",
  cafeFurniture: "supplier-cat-325",
  cushions: "supplier-cat-327",
  sofas: "supplier-cat-1395",
  loungers: "supplier-cat-412",
  loungeChairs: "supplier-cat-1397",
  poufs: "supplier-cat-1398",
  outdoorKitchens: "supplier-cat-1413",
  bbq: "supplier-cat-396",
  bbqSets: "supplier-cat-403",
  firewood: "supplier-cat-406",
  furnitureParts: "supplier-cat-1420",
  bikeStands: "supplier-cat-317",
  signs: "supplier-cat-317",
  souvenirs: "supplier-cat-825",
  flowerFigures: "catalog-family-art",
  maf: "supplier-cat-1424",
  dogEquipment: "supplier-cat-2137",
  animal: "cat-new-104",
  wasteSites: "supplier-cat-1406",
  city: "supplier-group-infrastructure",
  airConditionerBaskets: "supplier-cat-1425",
  playgroundSolutions: "supplier-cat-1444",
  stairs: "cat-1-1",
}

const has = (value, pattern) => pattern.test(value)

function classify(product) {
  const name = (product.name ?? "").toLocaleLowerCase("ru")
  const description = (product.description ?? "").toLocaleLowerCase("ru")
  const text = `${name} ${description}`
  const categoryIds = []
  const add = (id) => {
    if (id && !categoryIds.includes(id)) categoryIds.push(id)
  }

  if (has(name, /столб.*тротуарн|тротуарн.*столб|чугунная надолба|полусфера бетон/)) return [ids.bollards]
  if (has(name, /стол для сварки|ведро оцинкованное/)) return ["supplier-group-other"]
  if (has(name, /стойка пивная/)) return ["supplier-cat-1372"]
  if (has(name, /табурет/)) return [ids.gardenChairs]
  if (has(name, /диван парков/)) return [ids.sofas]
  if (has(name, /комплект матрасов|подушка на скамейку/)) return [ids.cushions]
  if (has(name, /арка тип/)) return [ids.maf]
  if (has(name, /пандус/)) return [ids.city]
  if (has(name, /гимнастическ.*комплекс/)) return [ids.workout]

  // Composite products belong to each clearly represented product family.
  const isBench = has(name, /скамейк|скамь|банкетк|лавк|диван парков/)
  const isBin = has(name, /урн|пепельниц|мусорн.*контейнер|велоурн/)
  if (isBench && isBin) {
    add(has(name, /садов/) ? ids.gardenBenches : ids.streetBenches)
    add(ids.bins)
    return categoryIds
  }
  if (isBench && has(name, /вазон|кашпо|цветочниц/)) {
    add(has(name, /садов/) ? ids.gardenBenches : ids.streetBenches)
    add(ids.flowers)
    return categoryIds
  }
  if (isBench && has(name, /навес|пергол/)) {
    add(has(name, /садов/) ? ids.gardenBenches : ids.streetBenches)
    add(has(name, /пергол/) ? ids.pergolas : ids.canopies)
    return categoryIds
  }

  if (has(name, /корзин.*кондиционер/)) return [ids.airConditionerBaskets]
  if (has(name, /площадк.*сбор.*мусор|контейнерн.*шкаф/)) return [ids.wasteSites]
  if (has(name, /контейнер.*пэт|контейнер.*бутыл|контейнер на колес|контейнер для.*мусор/)) return [ids.bins]
  if (has(name, /противогололедн.*материал/)) return [ids.maf]
  if (has(name, /урн|пепельниц|мусорн.*контейнер|велоурн/)) return [ids.bins]
  if (has(name, /фонар|светильник|световое оформ|светодиод|бра настенн|кронштейн.*(свет|фонар)|опора.*фонар/)) {
    if (has(name, /бра настенн|кронштейн/)) return [ids.lightingAccessories]
    if (has(name, /венчающ/)) return ["supplier-cat-320"]
    if (has(name, /ретро|чугунн/)) return [ids.retroLighting]
    if (has(name, /опора|стальн/)) return [ids.steelLighting]
    return [ids.lighting]
  }
  if (has(name, /скамейк|скамь|банкетк|лавк|диван парков|сиденье стальн/)) {
    return [has(name, /садов|садово-парк/) ? ids.gardenBenches : ids.streetBenches]
  }
  if (has(name, /цветочниц|вазон|кашпо|подвесной цветочник|приствольн.*(круг|реш)|решетк.*дерев|дерев.*решетк/)) return [ids.flowers]
  if (has(name, /велопарков|велосипедн.*парков|парковка .*мест/)) return [ids.bikeParking]
  if (has(name, /столбик|надолб|балясин/)) return [ids.bollards]
  if (has(name, /огражден|забор|ворота|арка тип/)) return [ids.fences]
  if (has(name, /лестниц/)) return [ids.stairs]
  if (has(name, /беседк|ротонд/)) return [ids.gazebos]
  if (has(name, /пергол|шпалер/)) return [ids.pergolas]
  if (has(name, /павильон для курения|кабина для курения/)) return [ids.smokingPavilions]
  if (has(name, /навес|козырек|павильон|пляжн.*кабинк|кабинк.*переодевания/)) return [ids.canopies]
  if (has(name, /качел|глайдер|кресло-качел/)) return [has(name, /детск|хбк/)? ids.childSwings : ids.swings]
  if (has(name, /качалк.*пружин/)) return [ids.springRiders]
  if (has(name, /игр.*вод|игр.*пес/)) return [ids.waterPlay]
  if (has(name, /детск|песочниц|игров|батут|карусел|балансир|горк|канатн.*дорог|хбик/)) {
    if (has(name, /комплекс|хбик/)) return [ids.playgroundComplexes]
    return [ids.playgrounds]
  }
  if (has(name, /тренажер|воркаут|брусья|параворкаут/)) return [ids.workout]
  if (has(name, /трибун/)) return [ids.stands]
  if (has(name, /теннисн.*стол/)) return [ids.tennis]
  if (has(name, /футбольн.*ворот|сетк.*ворот/)) return [ids.football]
  if (has(name, /лыж|сноуборд/)) return ["supplier-cat-410"]
  if (has(name, /спортивн.*площадк|гимнастическ.*комплекс|пандус|полиуретановое связующее/)) return [ids.sport]
  if (has(name, /собак|дрессиров|выгул/)) return [ids.dogEquipment]
  if (has(name, /животновод|кормушк|поилк|хбик-01/)) return [ids.animal]
  if (has(name, /гриль|мангал|барбекю|шампур|уголь|r.?egg|керамическ.*выпек|термометр.*кулинар|духовк.*голландск|сковород.*вок|чаша для угля|экран теплозащитный|теплозащитн.*экран|решетк.*грил|модуль.*рабочего пространства/)) return [ids.bbq]
  if (has(name, /дровниц|угольниц/)) return [ids.firewood]
  if (has(name, /уличная кухня/)) return [ids.outdoorKitchens]
  if (has(name, /комплект.*(садовой|уличной).*мебел|комплект мебели/)) return [ids.furnitureSets]
  if (has(name, /стол|табурет|стойка пивная/)) {
    if (has(name, /грил/)) return [ids.bbq]
    if (has(name, /садов|дачн/)) return [ids.gardenTables]
    return [ids.streetTables]
  }
  if (has(name, /кресло.*(кафе|ресторан)|стул.*кафе/)) return [ids.cafeFurniture]
  if (has(name, /стул|табурет/)) return [ids.gardenChairs]
  if (has(name, /кресло-лежак|лежак|шезлонг/)) return [ids.loungers]
  if (has(name, /кресло/)) return [ids.gardenChairs]
  if (has(name, /диван/)) return [ids.sofas]
  if (has(name, /пуф|бескаркасн/)) return [ids.poufs]
  if (has(name, /подушк|матрас|тент/)) return [ids.cushions]
  if (has(name, /мебел|фурнитур|комплект.*матрас|ящик для игрушек/)) return [ids.furnitureParts]
  if (has(name, /штендер|стенд|указател/)) return [ids.signs]
  if (has(name, /толстовк|сувенир/)) return [ids.souvenirs]
  if (has(name, /цветочн.*фигур|топиар|арт-объект|скульптур|монумент|стелла/)) return [ids.flowerFigures]
  if (has(name, /контейнерн.*площадк|площадк.*тбо/)) return [ids.wasteSites]
  if (has(name, /настил для габион|маф|полусфер.*бетон/)) return [ids.maf]
  if (has(name, /буккросс|парклет|остановк|люк колодезн|зарядное устройств|пандус|арка/)) return [ids.city]
  if (has(name, /краск|тонировк|лак яхт|брус для ремонт|запасн|комплектующ/)) return [ids.furnitureParts]
  if (has(name, /ведро оцинкованное/)) return ["supplier-group-other"]
  if (has(text, /подставк.*грил|модуль.*грил|полка для модуля|поддон.*жир|термометр|защита от дождя.*грил|стол.*грил|корзина.*теплозащитного экрана/)) return [ids.bbq]
  if (has(name, /арка тип|чугунная балясина/)) return [ids.fences]
  if (has(name, /опора/)) return [ids.lightingPosts]
  if (has(name, /кронштейн/)) return [ids.lightingAccessories]
  if (has(name, /шампур/)) return [ids.bbq]
  if (has(name, /топиар|фигур/)) return [ids.flowerFigures]

  // Descriptions disambiguate a handful of imported titles with opaque SKU names.
  if (has(description, /качел/)) return [ids.childSwings]
  if (has(description, /детск.*игров.*комплекс|игровой комплекс/)) return [ids.playgroundComplexes]
  if (has(description, /спортивн.*оборудован|тренировочн.*ворот/)) return [ids.sport]
  return null
}

function reclassify(data) {
  const categoryById = new Map(data.categories.map((category) => [category.id, category]))
  const counts = new Map()
  const unresolved = []
  let changed = 0

  for (const product of data.products) {
    const name = (product.name ?? "").toLocaleLowerCase("ru")
    const manualCorrection = /столб.*тротуарн|тротуарн.*столб|чугунная надолба|полусфера бетон|стол для сварки|ведро оцинкованное|стойка пивная|табурет|диван парков|комплект матрасов|подушка на скамейку|арка тип|пандус|гимнастическ.*комплекс/.test(name)
    if (!manualCorrection && !(product.categoryIds ?? []).some((id) => targets.has(id))) continue
    const nextIds = classify(product)
    if (!nextIds || nextIds.some((id) => !categoryById.has(id))) {
      unresolved.push(product)
      continue
    }
    // Preserve sale/new-arrival collection membership alongside the real product type.
    const collectionIds = (product.categoryIds ?? []).filter((id) => id === "supplier-cat-383" || id === "supplier-cat-1416")
    const finalIds = [...new Set([...nextIds, ...collectionIds])]
    if (JSON.stringify(product.categoryIds) !== JSON.stringify(finalIds)) {
      product.categoryIds = finalIds
      changed += 1
    }
    for (const id of finalIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  if (!unresolved.length) {
    const archiveCategoryExists = categoryById.has("supplier-cat-808")
    const archivedCategoryStillAssigned = data.products.some((product) => product.categoryIds?.includes("supplier-cat-808"))
    if (archiveCategoryExists && !archivedCategoryStillAssigned) {
      data.categories = data.categories.filter((category) => category.id !== "supplier-cat-808")
    }
  }

  return { changed, unresolved, counts }
}

const apply = process.argv.includes("--apply")
const root = process.cwd()
const files = ["src/data/products.json", "data/catalog.json"]
const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")

for (const relativePath of files) {
  const filePath = path.resolve(root, relativePath)
  let source
  try {
    source = await fs.readFile(filePath, "utf8")
  } catch (error) {
    if (error.code === "ENOENT") continue
    throw error
  }
  const data = JSON.parse(source)
  const result = reclassify(data)
  console.log(`${relativePath}: ${result.changed} product classifications updated`)
  for (const [id, count] of result.counts) console.log(`  ${categoryByIdName(data, id)} [${id}]: ${count}`)
  if (result.unresolved.length) {
    console.log(`  Unresolved (${result.unresolved.length}):`)
    for (const product of result.unresolved) console.log(`    ${product.id}\t${product.name}`)
  }
  if (!apply) continue

  if (relativePath === "data/catalog.json") {
    const backup = `${filePath}.before-categorization-${timestamp}.bak`
    await fs.copyFile(filePath, backup)
    console.log(`  Backup: ${backup}`)
  }
  const temporaryPath = `${filePath}.tmp`
  await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8")
  await fs.rename(temporaryPath, filePath)
}

function categoryByIdName(data, id) {
  return data.categories.find((category) => category.id === id)?.name ?? "Unknown category"
}

if (!apply) console.log("Dry run only. Pass --apply to save changes.")

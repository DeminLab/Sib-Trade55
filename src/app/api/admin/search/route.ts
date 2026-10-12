import { NextResponse } from "next/server"

import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { readCatalog } from "@/lib/catalog/catalog-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied

  const query = new URL(request.url).searchParams.get("q")?.trim().toLocaleLowerCase("ru-RU") ?? ""
  if (query.length < 2) return NextResponse.json({ products: [], categories: [] })

  const { products, categories, brands } = await readCatalog()
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const brandsById = new Map(brands.map((brand) => [brand.id, brand.name]))
  const matchingCategories = categories.filter((category) =>
    `${category.name} ${category.slug} ${category.description}`.toLocaleLowerCase("ru-RU").includes(query)
  ).slice(0, 6).map((category) => {
    const parts = [category.name]
    let parent = category.parentId ? categoriesById.get(category.parentId) : undefined
    while (parent && parts.length < 6) {
      parts.unshift(parent.name)
      parent = parent.parentId ? categoriesById.get(parent.parentId) : undefined
    }
    return { id: category.id, name: category.name, path: parts.join(" / ") }
  })
  const matchingProducts = products.filter((product) => product.status !== "archived" &&
    [product.name, product.slug, product.description, brandsById.get(product.brandId) ?? "", ...product.variants.map((variant) => variant.sku)]
      .some((value) => value.toLocaleLowerCase("ru-RU").includes(query))
  ).slice(0, 8).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.variants[0]?.sku ?? "",
    status: product.status,
  }))

  return NextResponse.json({ products: matchingProducts, categories: matchingCategories }, {
    headers: { "Cache-Control": "private, no-store" },
  })
}

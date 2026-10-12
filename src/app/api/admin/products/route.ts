import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { authorizeCatalogAdmin, CatalogConflictError, readProductForm } from "@/lib/catalog/admin-api"
import { readCatalog, updateCatalog } from "@/lib/catalog/catalog-store"
import type { Product } from "@/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const archive = searchParams.get("archive") === "true"
  const query = (searchParams.get("q") ?? "").trim().toLocaleLowerCase("ru-RU")
  const requestedStatus = searchParams.get("status")
  const categoryId = searchParams.get("categoryId") ?? ""
  const requestedBrandId = searchParams.get("brandId") ?? ""
  const brandId = requestedBrandId === "all" ? "" : requestedBrandId
  const sort = searchParams.get("sort") ?? "updated"
  const availability = searchParams.get("availability") ?? "all"
  const pricing = searchParams.get("pricing") ?? "all"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit")) || 25))
  const { products, categories, brands } = await readCatalog()
  const categoriesById = new Map(categories.map((category) => [category.id, category.name]))
  const brandNameById = new Map(brands.map((brand) => [brand.id, brand.name]))
  const categoryTreeIds = new Set<string>()
  if (categoryId) {
    categoryTreeIds.add(categoryId)
    let changed = true
    while (changed) {
      changed = false
      for (const category of categories) {
        if (category.parentId && categoryTreeIds.has(category.parentId) && !categoryTreeIds.has(category.id)) {
          categoryTreeIds.add(category.id)
          changed = true
        }
      }
    }
  }
  const filtered = products.filter((product) => {
    if (archive ? product.status !== "archived" : product.status === "archived") return false
    if (requestedStatus && requestedStatus !== "all" && product.status !== requestedStatus) return false
    if (categoryId && !product.categoryIds.some((id) => categoryTreeIds.has(id))) return false
    if (brandId && product.brandId !== brandId) return false
    if (availability === "tracked" && !product.variants.some((variant) => variant.inventory.trackInventory)) return false
    if (availability === "out" && (!product.variants.length || product.variants.some((variant) => !variant.inventory.trackInventory || variant.inventory.quantity > 0))) return false
    if (pricing === "priced" && !product.variants.some((variant) => !variant.priceOnRequest && variant.price > 0)) return false
    if (pricing === "request" && !product.variants.some((variant) => variant.priceOnRequest)) return false
    if (!query) return true
    const categoryNames = product.categoryIds.map((id) => categoriesById.get(id) ?? "")
    const variantSkus = product.variants.map((variant) => variant.sku)
    return [product.name, product.slug, product.description, brandNameById.get(product.brandId) ?? "", ...categoryNames, ...variantSkus].some((value) =>
      value?.toLocaleLowerCase("ru-RU").includes(query)
    )
  })
  filtered.sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name, "ru-RU")
    if (sort === "price") return (left.variants[0]?.price ?? 0) - (right.variants[0]?.price ?? 0)
    if (sort === "priceDesc") return (right.variants[0]?.price ?? 0) - (left.variants[0]?.price ?? 0)
    return right.updatedAt.localeCompare(left.updatedAt)
  })
  const offset = (page - 1) * limit
  return NextResponse.json({
    items: filtered.slice(offset, offset + limit).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      sku: product.variants[0]?.sku ?? "",
      variantCount: product.variants.length,
      stockTracked: product.variants.some((variant) => variant.inventory.trackInventory),
      stockQuantity: product.variants.reduce((total, variant) => total + (variant.inventory.trackInventory ? variant.inventory.quantity : 0), 0),
      price: product.variants[0]?.price ?? 0,
      priceOnRequest: product.variants[0]?.priceOnRequest ?? false,
      image: product.images[0] ?? null,
      categories: product.categoryIds.map((id) => categoriesById.get(id)).filter(Boolean),
    })),
    facets: { categories, brands },
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
  })
}

export async function POST(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const form = await readProductForm(request)
  if ("error" in form) return NextResponse.json({ message: form.error }, { status: 400 })

  try {
    const product = await updateCatalog((catalog) => {
      const { data } = form
      if (catalog.products.some((item) => item.slug === data.slug) || catalog.categories.some((item) => item.slug === data.slug) || catalog.brands.some((item) => item.slug === data.slug)) {
        throw new CatalogConflictError("Этот адрес уже используется товаром или категорией")
      }
      if (data.categoryIds.some((id) => !catalog.categories.some((category) => category.id === id))) {
        throw new CatalogConflictError("Выберите существующую категорию")
      }
      const brand = data.brandId ? catalog.brands.find((item) => item.id === data.brandId) : undefined
      if (data.brandId && !brand) throw new CatalogConflictError("Выберите существующий бренд")

      const now = new Date().toISOString()
      const id = `product-${randomUUID()}`
      const variants = data.variants?.map((variant, index) => ({
        ...variant,
        id: `variant-${randomUUID()}`,
        productId: id,
        price: variant.priceOnRequest ? 0 : variant.price,
        images: index === 0 ? data.images : variant.images,
      })) ?? [{
        id: `variant-${randomUUID()}`,
        productId: id,
        sku: data.sku || `ST-${randomUUID().slice(0, 8).toUpperCase()}`,
        name: "Стандартная",
        price: data.priceOnRequest ? 0 : data.price,
        ...(data.priceOnRequest ? { priceOnRequest: true } : {}),
        currency: "RUB",
        inventory: { quantity: 0, trackInventory: false, allowBackorder: true },
        options: [],
        images: data.images,
      }]
      const created: Product = {
        id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        body: data.body,
        images: data.images,
        status: data.status,
        brandId: brand?.id ?? catalog.brands.find((item) => item.id === "brand-supplied-products")?.id ?? catalog.brands[0]?.id ?? "",
        categoryIds: data.categoryIds,
        tags: data.tags,
        variants,
        rating: 0,
        reviewCount: 0,
        featured: data.featured,
        createdAt: now,
        updatedAt: now,
      }
      catalog.products.unshift(created)
      return created
    })
    return NextResponse.json({ item: product }, { status: 201 })
  } catch (error) {
    if (error instanceof CatalogConflictError) return NextResponse.json({ message: error.message }, { status: 409 })
    return NextResponse.json({ message: "Не удалось сохранить товар" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const parsed = (await request.json().catch(() => null)) as { ids?: unknown; status?: unknown } | null
  const ids = Array.isArray(parsed?.ids) ? [...new Set(parsed.ids.filter((id): id is string => typeof id === "string" && id.length > 0))] : []
  const status = parsed?.status
  if (ids.length === 0 || ids.length > 100 || !["active", "draft", "archived"].includes(String(status))) {
    return NextResponse.json({ message: "Выберите до 100 товаров и допустимый статус" }, { status: 400 })
  }

  try {
    const updatedCount = await updateCatalog((catalog) => {
      const selected = catalog.products.filter((product) => ids.includes(product.id))
      if (selected.length !== ids.length) throw new CatalogConflictError("Некоторые выбранные товары не найдены")
      const now = new Date().toISOString()
      for (const product of selected) {
        product.status = status as Product["status"]
        product.updatedAt = now
      }
      return selected.length
    })
    return NextResponse.json({ updatedCount })
  } catch (error) {
    if (error instanceof CatalogConflictError) return NextResponse.json({ message: error.message }, { status: 404 })
    return NextResponse.json({ message: "Не удалось обновить выбранные товары" }, { status: 500 })
  }
}


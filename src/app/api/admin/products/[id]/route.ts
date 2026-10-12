import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { authorizeCatalogAdmin, CatalogConflictError, readProductForm } from "@/lib/catalog/admin-api"
import { readCatalog, updateCatalog } from "@/lib/catalog/catalog-store"
import type { Product } from "@/types"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  const { products } = await readCatalog()
  const product = products.find((item) => item.id === id)
  return product
    ? NextResponse.json({ item: product })
    : NextResponse.json({ message: "Товар не найден" }, { status: 404 })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  const form = await readProductForm(request)
  if ("error" in form) return NextResponse.json({ message: form.error }, { status: 400 })

  try {
    const product = await updateCatalog((catalog) => {
      const index = catalog.products.findIndex((item) => item.id === id)
      if (index < 0) throw new CatalogConflictError("Товар не найден")
      const { data } = form
      if (catalog.products.some((item) => item.id !== id && item.slug === data.slug) || catalog.categories.some((item) => item.slug === data.slug) || catalog.brands.some((item) => item.slug === data.slug)) {
        throw new CatalogConflictError("Этот адрес уже используется товаром или категорией")
      }
      if (data.categoryIds.some((categoryId) => !catalog.categories.some((category) => category.id === categoryId))) {
        throw new CatalogConflictError("Выберите существующую категорию")
      }
      if (data.brandId && !catalog.brands.some((brand) => brand.id === data.brandId)) {
        throw new CatalogConflictError("Выберите существующий бренд")
      }

      const current = catalog.products[index]
      const now = new Date().toISOString()
      let variants: Product["variants"] | undefined = data.variants?.map((variant, variantIndex) => {
        const previous = variant.id ? current.variants.find((item) => item.id === variant.id) : undefined
        if (variant.id && !previous) throw new CatalogConflictError("Вариант товара не найден")
        return {
          ...previous,
          ...variant,
          id: previous?.id ?? `variant-${randomUUID()}`,
          productId: current.id,
          price: variant.priceOnRequest ? 0 : variant.price,
          images: variantIndex === 0 ? data.images : variant.images,
        }
      })
      if (!variants) {
        variants = current.variants.length ? current.variants.map((variant, variantIndex) => variantIndex === 0 ? {
          ...variant,
          sku: data.sku,
          price: data.priceOnRequest ? 0 : data.price,
          ...(data.priceOnRequest ? { priceOnRequest: true } : { priceOnRequest: false }),
          images: data.images,
        } : variant) : []
        if (variants.length === 0) variants.push({
          id: `variant-${id}`,
          productId: id,
          sku: data.sku,
          name: "Стандартная",
          price: data.priceOnRequest ? 0 : data.price,
          ...(data.priceOnRequest ? { priceOnRequest: true } : {}),
          currency: "RUB",
          inventory: { quantity: 0, trackInventory: false, allowBackorder: true },
          options: [],
          images: data.images,
        })
      }
      const updated: Product = {
        ...current,
        name: data.name,
        slug: data.slug,
        description: data.description,
        body: data.body,
        images: data.images,
        status: data.status,
        brandId: data.brandId ?? current.brandId,
        categoryIds: data.categoryIds,
        tags: data.tags,
        featured: data.featured,
        variants,
        updatedAt: now,
      }
      catalog.products[index] = updated
      return updated
    })
    return NextResponse.json({ item: product })
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return NextResponse.json({ message: error.message }, { status: error.message === "Товар не найден" ? 404 : 409 })
    }
    return NextResponse.json({ message: "Не удалось обновить товар" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  try {
    const deleted = await updateCatalog((catalog) => {
      const index = catalog.products.findIndex((item) => item.id === id)
      if (index < 0) throw new CatalogConflictError("Товар не найден")
      if (catalog.products[index].status !== "archived") {
        throw new CatalogConflictError("Сначала перенесите товар в архив")
      }
      catalog.products.splice(index, 1)
      return true
    })
    return NextResponse.json({ deleted })
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return NextResponse.json({ message: error.message }, { status: error.message === "Товар не найден" ? 404 : 409 })
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Не удалось удалить товар" }, { status: 500 })
  }
}


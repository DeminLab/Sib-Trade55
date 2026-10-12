import { NextResponse } from "next/server"

import { authorizeCatalogAdmin, CatalogConflictError, readCategoryForm } from "@/lib/catalog/admin-api"
import { readCatalog, updateCatalog } from "@/lib/catalog/catalog-store"
import type { Category } from "@/types"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  const { categories, products } = await readCatalog()
  const category = categories.find((item) => item.id === id)
  if (!category) return NextResponse.json({ message: "Категория не найдена" }, { status: 404 })
  const productCount = products.filter((product) => product.categoryIds.includes(id)).length
  return NextResponse.json({ item: { ...category, productCount } })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  const form = await readCategoryForm(request)
  if ("error" in form) return NextResponse.json({ message: form.error }, { status: 400 })

  try {
    const category = await updateCatalog((catalog) => {
      const index = catalog.categories.findIndex((item) => item.id === id)
      if (index < 0) throw new CatalogConflictError("Категория не найдена")
      const { data } = form
      if (catalog.categories.some((item) => item.id !== id && item.slug === data.slug) || catalog.products.some((item) => item.slug === data.slug) || catalog.brands.some((item) => item.slug === data.slug)) {
        throw new CatalogConflictError("Этот адрес уже используется товаром или категорией")
      }
      const current = catalog.categories[index]
      const parentId = data.parentId || undefined
      if (parentId) {
        if (!catalog.categories.some((item) => item.id === parentId)) throw new CatalogConflictError("Выберите существующую родительскую категорию")
        let ancestor = catalog.categories.find((item) => item.id === parentId)
        while (ancestor) {
          if (ancestor.id === id) throw new CatalogConflictError("Нельзя вложить категорию в саму себя или её подкатегорию")
          ancestor = ancestor.parentId ? catalog.categories.find((item) => item.id === ancestor!.parentId) : undefined
        }
      }
      const updated: Category = {
        ...current,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image ?? undefined,
        parentId,
        order: data.order,
      }
      catalog.categories[index] = updated
      return updated
    })
    return NextResponse.json({ item: category })
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return NextResponse.json({ message: error.message }, { status: error.message.includes("не найдена") ? 404 : 409 })
    }
    return NextResponse.json({ message: "Не удалось обновить категорию" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id } = await params
  try {
    await updateCatalog((catalog) => {
      const index = catalog.categories.findIndex((item) => item.id === id)
      if (index < 0) throw new CatalogConflictError("Категория не найдена")
      if (!catalog.categories[index].parentId) throw new CatalogConflictError("Корневую категорию удалить нельзя")
      if (catalog.products.some((product) => product.categoryIds.includes(id))) throw new CatalogConflictError("Сначала перенесите товары из этой категории")
      if (catalog.categories.some((category) => category.parentId === id)) throw new CatalogConflictError("Сначала перенесите подкатегории")
      catalog.categories.splice(index, 1)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof CatalogConflictError) return NextResponse.json({ message: error.message }, { status: error.message === "Категория не найдена" ? 404 : 409 })
    return NextResponse.json({ message: "Не удалось удалить категорию" }, { status: 500 })
  }
}


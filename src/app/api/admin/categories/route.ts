import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { authorizeCatalogAdmin, CatalogConflictError, readCategoryForm } from "@/lib/catalog/admin-api"
import { readCatalog, updateCatalog } from "@/lib/catalog/catalog-store"
import type { Category } from "@/types"

export const runtime = "nodejs"

export async function GET() {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { categories, products } = await readCatalog()
  const childrenByParent = new Map<string, string[]>()
  for (const category of categories) {
    if (!category.parentId) continue
    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category.id)
    childrenByParent.set(category.parentId, children)
  }
  const subtreeIds = (rootId: string) => {
    const ids = new Set([rootId])
    const queue = [rootId]
    for (let index = 0; index < queue.length; index += 1) {
      for (const childId of childrenByParent.get(queue[index]) ?? []) {
        if (ids.has(childId)) continue
        ids.add(childId)
        queue.push(childId)
      }
    }
    return ids
  }
  const productCounts = new Map<string, number>()
  for (const product of products) {
    for (const categoryId of new Set(product.categoryIds)) productCounts.set(categoryId, (productCounts.get(categoryId) ?? 0) + 1)
  }
  return NextResponse.json({ items: categories.map((category) => {
    const ids = subtreeIds(category.id)
    const productCount = products.filter(product => product.categoryIds.some(id => ids.has(id))).length
    return { ...category, productCount: productCounts.get(category.id) ?? 0, subtreeProductCount: productCount }
  }) })
}

export async function POST(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const form = await readCategoryForm(request)
  if ("error" in form) return NextResponse.json({ message: form.error }, { status: 400 })

  try {
    const category = await updateCatalog((catalog) => {
      const { data } = form
      if (catalog.categories.some((item) => item.slug === data.slug) || catalog.products.some((item) => item.slug === data.slug) || catalog.brands.some((item) => item.slug === data.slug)) {
        throw new CatalogConflictError("Этот адрес уже используется товаром или категорией")
      }
      const parentId = data.parentId || undefined
      if (parentId && !catalog.categories.some((item) => item.id === parentId)) {
        throw new CatalogConflictError("Выберите существующую родительскую категорию")
      }
      const created: Category = {
        id: `category-${randomUUID()}`,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image ?? undefined,
        ...(parentId ? { parentId } : {}),
        order: data.order,
      }
      catalog.categories.push(created)
      return created
    })
    return NextResponse.json({ item: category }, { status: 201 })
  } catch (error) {
    if (error instanceof CatalogConflictError) return NextResponse.json({ message: error.message }, { status: 409 })
    return NextResponse.json({ message: "Не удалось сохранить категорию" }, { status: 500 })
  }
}


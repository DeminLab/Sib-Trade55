import type { Category, CategoryRepository, Product } from "@/types"
import { readCatalog } from "@/lib/catalog/catalog-store"

function getCategoriesWithProducts(categories: Category[], products: Product[]) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const categoriesWithProducts = new Set<string>()

  for (const product of products) {
    if (product.status !== "active") continue
    for (const categoryId of product.categoryIds) {
      let category = categoriesById.get(categoryId)
      while (category && !categoriesWithProducts.has(category.id)) {
        categoriesWithProducts.add(category.id)
        category = category.parentId ? categoriesById.get(category.parentId) : undefined
      }
    }
  }

  return categoriesWithProducts
}

export const sqliteCategoryRepository: CategoryRepository & {
  getChildren(parentId: string): Promise<Category[]>
  getTopLevel(): Promise<Category[]>
  getAncestors(categoryId: string): Promise<Category[]>
} = {
  async list() {
    const { categories, products } = await readCatalog()
    const categoriesWithProducts = getCategoriesWithProducts(categories, products)
    return categories
      .filter((category) => categoriesWithProducts.has(category.id))
      .sort((a, b) => a.order - b.order)
  },

  async getBySlug(slug) {
    const { categories, products } = await readCatalog()
    const categoriesWithProducts = getCategoriesWithProducts(categories, products)
    return categories.find((c) => c.slug === slug && categoriesWithProducts.has(c.id)) ?? null
  },

  async getById(id) {
    const { categories } = await readCatalog()
    return categories.find((c) => c.id === id) ?? null
  },

  async getChildren(parentId) {
    const { categories, products } = await readCatalog()
    const categoriesWithProducts = getCategoriesWithProducts(categories, products)
    return categories
      .filter((c) => c.parentId === parentId && categoriesWithProducts.has(c.id))
      .sort((a, b) => a.order - b.order)
  },

  async getTopLevel() {
    const { categories, products } = await readCatalog()
    const categoriesWithProducts = getCategoriesWithProducts(categories, products)
    return categories
      .filter((c) => !c.parentId && categoriesWithProducts.has(c.id))
      .sort((a, b) => a.order - b.order)
  },

  /** Walk up the parent chain and return ancestors ordered root → leaf */
  async getAncestors(categoryId) {
    const { categories } = await readCatalog()
    const chain: Category[] = []
    let current = categories.find((c) => c.id === categoryId)
    while (current) {
      chain.unshift(current)
      current = current.parentId
        ? categories.find((c) => c.id === current!.parentId)
        : undefined
    }
    return chain
  },
}

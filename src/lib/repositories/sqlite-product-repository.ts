import type {
  Product,
  ProductFilters,
  ProductRepository,
  SortOption,
  PaginationParams,
  PaginatedResult,
} from "@/types"
import { readCatalog } from "@/lib/catalog/catalog-store"
import { isPriceOnRequest } from "@/lib/product-presentation"

function getCategoryTreeIds(categoryId: string, categories: Awaited<ReturnType<typeof readCatalog>>["categories"]): Set<string> {
  const categoryIds = new Set([categoryId])
  let changed = true

  while (changed) {
    changed = false
    for (const category of categories) {
      if (category.parentId && categoryIds.has(category.parentId) && !categoryIds.has(category.id)) {
        categoryIds.add(category.id)
        changed = true
      }
    }
  }

  return categoryIds
}

function applyFilters(items: Product[], categories: Awaited<ReturnType<typeof readCatalog>>["categories"], filters?: ProductFilters): Product[] {
  if (!filters) return items.filter((p) => p.status === "active")

  let result = items.filter((p) => p.status === "active")
  if (filters.brandId) result = result.filter(p => p.brandId === filters.brandId)

  if (filters.category) {
    const category = categories.find((c) => c.slug === filters.category)
    if (category) {
      const categoryIds = getCategoryTreeIds(category.id, categories)
      result = result.filter((p) => p.categoryIds.some((id) => categoryIds.has(id)))
    } else return []
  }

  if (filters.priceRange) {
    const { min, max } = filters.priceRange
    result = result.filter((p) => {
      return p.variants.some((variant) => !isPriceOnRequest(variant) &&
        (min === undefined || variant.price >= min) && (max === undefined || variant.price <= max))
    })
  }

  if (filters.inStock !== undefined) {
    result = result.filter((p) =>
      p.variants.some((v) =>
        filters.inStock
          ? v.inventory.quantity > 0
          : true
      )
    )
  }

  if (filters.search) {
    const query = filters.search.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')
    result = result.filter(
      (p) =>
        `${p.name} ${p.description} ${p.tags.join(' ')} ${p.variants.map(v => v.sku).join(' ')}`
          .toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(query)
    )
  }

  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((p) =>
      filters.tags!.some((t) => p.tags.includes(t))
    )
  }

  return result
}

function applySort(items: Product[], sort?: SortOption): Product[] {
  if (!sort) return items

  return [...items].sort((a, b) => {
    let comparison = 0

    switch (sort.field) {
      case "price": {
        const unknownA = !a.variants[0] || isPriceOnRequest(a.variants[0])
        const unknownB = !b.variants[0] || isPriceOnRequest(b.variants[0])
        if (unknownA !== unknownB) return unknownA ? 1 : -1
        const priceA = a.variants[0]?.price ?? 0
        const priceB = b.variants[0]?.price ?? 0
        comparison = priceA - priceB
        break
      }
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      default:
        comparison = 0
    }

    return sort.order === "desc" ? -comparison : comparison
  })
}

function paginate<T>(
  items: T[],
  pagination?: PaginationParams
): PaginatedResult<T> {
  const requestedPage = Math.max(1, Math.floor(pagination?.page ?? 1))
  const limit = Math.max(1, Math.min(10_000, Math.floor(pagination?.limit ?? 12)))
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)

  return {
    items: paginatedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export const sqliteProductRepository: ProductRepository = {
  async list(filters, sort, pagination) {
    const { products, categories } = await readCatalog()
    let result = applyFilters(products, categories, filters)
    result = applySort(result, sort)
    return paginate(result, pagination)
  },

  async getBySlug(slug) {
    const { products } = await readCatalog()
    return products.find((p) => p.slug === slug && p.status === "active") ?? null
  },

  async getById(id) {
    const { products } = await readCatalog()
    return products.find((p) => p.id === id) ?? null
  },

  async getFeatured(limit = 4) {
    const { products } = await readCatalog()
    return products
      .filter((p) => p.featured && p.status === "active")
      .slice(0, limit)
  },

  async getByCategory(categorySlug, pagination) {
    const { products, categories } = await readCatalog()
    const category = categories.find((c) => c.slug === categorySlug)
    if (!category) return paginate([], pagination)

    const categoryIds = getCategoryTreeIds(category.id, categories)
    const categoryProducts = products.filter(
      (p) => p.categoryIds.some((id) => categoryIds.has(id)) && p.status === "active"
    )
    return paginate(categoryProducts, pagination)
  },

  async search(query, pagination) {
    const { products, categories } = await readCatalog()
    const filtered = applyFilters(products, categories, { search: query })
    return paginate(filtered, pagination)
  },
}

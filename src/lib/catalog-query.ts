import type { SortOption } from "@/types"

export type CatalogQuery = { q?: string; category?: string; min?: string; max?: string; stock?: string; sort?: string; page?: string }
export function normalizeCatalogQuery(input: Record<string, unknown>): CatalogQuery {
  const result: CatalogQuery = {}
  for (const key of ['q', 'category', 'min', 'max', 'stock', 'sort', 'page'] as const) {
    const value = Array.isArray(input[key]) ? input[key][0] : input[key]
    if (typeof value === 'string') result[key] = value.slice(0, 300)
  }
  return result
}

const sorts: Record<string, SortOption> = {
  newest: { field: "createdAt", order: "desc" },
  "price-asc": { field: "price", order: "asc" },
  "price-desc": { field: "price", order: "desc" },
  name: { field: "name", order: "asc" },
}

function amount(value?: string) {
  if (!value?.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

export function parseCatalogQuery(query: CatalogQuery, category?: string) {
  const min = amount(query.min)
  const max = amount(query.max)
  const page = Number(query.page)
  return {
    filters: {
      category: category ?? query.category,
      search: query.q?.trim(),
      priceRange: min !== undefined || max !== undefined ? { min, max } : undefined,
      inStock: query.stock === "1" ? true : undefined,
    },
    sort: sorts[query.sort ?? ""] ?? sorts.newest,
    pagination: { page: Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1, limit: 24 },
  }
}

export function catalogSearchParams(query: CatalogQuery) {
  return Object.fromEntries(Object.entries(query).filter(([key, value]) => key !== "page" && typeof value === "string" && value !== "")) as Record<string, string>
}

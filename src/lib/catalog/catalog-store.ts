import { readSqliteCatalog, updateSqliteCatalog } from "@/lib/database/sqlite-store"
import type { Brand, Category, Product } from "@/types"

export interface CatalogData {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  [key: string]: unknown
}

export async function readCatalog() {
  return readSqliteCatalog<CatalogData>()
}

export function updateCatalog<T>(update: (catalog: CatalogData) => T | Promise<T>) {
  return updateSqliteCatalog(update)
}

import type { Brand } from "@/types"
import { readCatalog } from "@/lib/catalog/catalog-store"

export const sqliteBrandRepository = {
  async list(): Promise<Brand[]> {
    return (await readCatalog()).brands
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    return (await readCatalog()).brands.find((b) => b.slug === slug) ?? null
  },

  async getById(id: string): Promise<Brand | null> {
    return (await readCatalog()).brands.find((b) => b.id === id) ?? null
  },
}

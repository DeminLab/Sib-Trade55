import type { CmsPage } from "@/types"
import { readSqliteContent } from "@/lib/database/sqlite-store"

export const sqlitePageRepository = {
  async list(): Promise<CmsPage[]> {
    const { pages } = await readSqliteContent<{ pages: CmsPage[] }>("pages")
    return [...pages].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  },

  async getBySlug(slug: string): Promise<CmsPage | null> {
    const { pages } = await readSqliteContent<{ pages: CmsPage[] }>("pages")
    return pages.find((p) => p.slug === slug) ?? null
  },

  async getById(id: string): Promise<CmsPage | null> {
    const { pages } = await readSqliteContent<{ pages: CmsPage[] }>("pages")
    return pages.find((p) => p.id === id) ?? null
  },
}

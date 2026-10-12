import type { BlogPost, PaginatedResult, PaginationParams } from "@/types"
import { readSqliteContent } from "@/lib/database/sqlite-store"

function paginate<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 9
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit
  return {
    items: items.slice(offset, offset + limit),
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

export const sqliteBlogRepository = {
  async list(params?: PaginationParams): Promise<PaginatedResult<BlogPost>> {
    const { posts } = await readSqliteContent<{ posts: BlogPost[] }>("blog")
    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    return paginate(sorted, params)
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { posts } = await readSqliteContent<{ posts: BlogPost[] }>("blog")
    return posts.find((p) => p.slug === slug) ?? null
  },

  async getByTag(
    tag: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<BlogPost>> {
    const { posts } = await readSqliteContent<{ posts: BlogPost[] }>("blog")
    const filtered = posts.filter((p) => p.tags.includes(tag))
    return paginate(filtered, params)
  },
}

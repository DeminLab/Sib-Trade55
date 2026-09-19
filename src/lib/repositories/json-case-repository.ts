import type {
  CaseFilters,
  CaseProject,
  CaseRepository,
  PaginatedResult,
  PaginationParams,
} from "@/types"
import data from "@/data/cases.json"

const projects = data.cases as CaseProject[]

function paginate<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 12
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
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

function matches(project: CaseProject, filters?: CaseFilters) {
  if (!filters) return true
  if (filters.category && project.categorySlug !== filters.category) return false
  if (filters.city && project.city !== filters.city) return false
  if (filters.year && project.year !== filters.year) return false

  if (filters.search) {
    const query = filters.search.toLowerCase()
    const text = `${project.title} ${project.excerpt} ${project.city} ${project.category}`.toLowerCase()
    if (!text.includes(query)) return false
  }

  return true
}

export const jsonCaseRepository: CaseRepository = {
  async list(filters, pagination) {
    const filtered = projects
      .filter((project) => matches(project, filters))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year)
    return paginate(filtered, pagination)
  },

  async getBySlug(slug) {
    return projects.find((project) => project.slug === slug) ?? null
  },

  async getById(id) {
    return projects.find((project) => project.id === id) ?? null
  },

  async getCategories() {
    const counts = new Map<string, { name: string; slug: string; count: number }>()
    for (const project of projects) {
      const current = counts.get(project.categorySlug)
      counts.set(project.categorySlug, {
        name: project.category,
        slug: project.categorySlug,
        count: (current?.count ?? 0) + 1,
      })
    }
    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"))
  },

  async getRelated(project, limit = 3) {
    const sameCategory = projects
      .filter((candidate) => candidate.id !== project.id && candidate.categorySlug === project.categorySlug)
      .slice(0, limit)

    if (sameCategory.length > 0) return sameCategory

    return projects
      .filter((candidate) => candidate.id !== project.id)
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year)
      .slice(0, limit)
  },
}

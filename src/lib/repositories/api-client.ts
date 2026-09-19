import type { ApiResponse, RepositoryQuery } from "@/types"

export class RepositoryApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message)
    this.name = "RepositoryApiError"
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  fetcher?: typeof fetch
  credentials?: RequestCredentials
}

export function createApiClient(options: ApiClientOptions = {}) {
  const fetcher = options.fetcher ?? fetch
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, {
        ...init,
        credentials: init.credentials ?? options.credentials ?? "include",
        headers: { Accept: "application/json", ...init.headers },
      })
      const payload = (await response.json().catch(() => null)) as ApiResponse<T> | { message?: string } | null

      if (!response.ok) {
        const error = payload && "error" in payload ? payload.error : undefined
        const message = error?.message ?? (payload && "message" in payload ? payload.message : undefined) ?? "API request failed"
        throw new RepositoryApiError(response.status, message, error?.code)
      }

      if (payload && "data" in payload) return payload.data as T
      return payload as T
    },

    query<TFilters>(query?: RepositoryQuery<TFilters>) {
      const params = new URLSearchParams()
      if (query?.pagination?.page !== undefined) params.set("page", String(query.pagination.page))
      if (query?.pagination?.limit !== undefined) params.set("limit", String(query.pagination.limit))
      if (query?.search) params.set("search", query.search)
      if (query?.filters) {
        Object.entries(query.filters as Record<string, unknown>).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return
          params.set(key, Array.isArray(value) ? value.join(",") : String(value))
        })
      }
      const sorts = query?.sort ? (Array.isArray(query.sort) ? query.sort : [query.sort]) : []
      sorts.forEach((sort, index) => params.set(`sort[${index}]`, `${sort.field}:${sort.order}`))
      const suffix = params.toString()
      return suffix ? `?${suffix}` : ""
    },
  }
}

export const apiClient = createApiClient()

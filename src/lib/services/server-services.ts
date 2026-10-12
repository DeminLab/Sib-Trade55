import type { ContactRepository, ContactResponse, PaginatedResult, QuoteRequest, QuoteRequestRepository } from "@/types"
import { createCustomerRequest } from "@/lib/requests/request-store"
import { getSqliteRequest, listSqliteRequests, updateSqliteRequest } from "@/lib/database/sqlite-store"
import { contactRequestSchema, quoteRequestSchema, requestStatusSchema } from "@/lib/requests/validation"

export class ServiceNotConfiguredError extends Error {
  constructor(service: string) {
    super(`${service} service is not configured`)
    this.name = "ServiceNotConfiguredError"
  }
}

export const contactRepository: ContactRepository = {
  async create(request): Promise<ContactResponse> {
    return createCustomerRequest({ kind: "contact", data: contactRequestSchema.parse(request) })
  },
}

export const quoteRequestRepository: QuoteRequestRepository = {
  async create(request) {
    return createCustomerRequest({ kind: "quote", data: quoteRequestSchema.parse(request) })
  },
  async list(query): Promise<PaginatedResult<QuoteRequest>> {
    const page = Math.max(1, query?.pagination?.page ?? 1)
    const limit = Math.min(100, Math.max(1, query?.pagination?.limit ?? 25))
    const { items, total } = await listSqliteRequests("quote", page, limit)
    return { items: items.flatMap((item) => item.kind === "quote" ? [{ ...item.data, id: item.id, status: item.status, createdAt: item.createdAt }] : []), pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } }
  },
  async getById(id): Promise<QuoteRequest | null> {
    const item = await getSqliteRequest(id)
    return item?.kind === "quote" ? { ...item.data, id: item.id, status: item.status, createdAt: item.createdAt } : null
  },
  async updateStatus(id, status): Promise<QuoteRequest> {
    const item = await getSqliteRequest(id)
    if (item?.kind !== "quote") throw new Error("Запрос КП не найден")
    await updateSqliteRequest(id, { status: requestStatusSchema.parse(status) })
    return { ...item.data, id: item.id, status, createdAt: item.createdAt }
  },
}

import type { ContactRepository, ContactResponse, PaginatedResult, QuoteRequest, QuoteRequestRepository } from "@/types"

export class ServiceNotConfiguredError extends Error {
  constructor(service: string) {
    super(`${service} service is not configured`)
    this.name = "ServiceNotConfiguredError"
  }
}

export const contactRepository: ContactRepository = {
  async create(): Promise<ContactResponse> {
    throw new ServiceNotConfiguredError("Contact delivery")
  },
}

export const quoteRequestRepository: QuoteRequestRepository = {
  async create() {
    throw new ServiceNotConfiguredError("Quote request")
  },
  async list(): Promise<PaginatedResult<QuoteRequest>> {
    throw new ServiceNotConfiguredError("Quote request")
  },
  async getById(): Promise<QuoteRequest | null> {
    throw new ServiceNotConfiguredError("Quote request")
  },
  async updateStatus(): Promise<QuoteRequest> {
    throw new ServiceNotConfiguredError("Quote request")
  },
}

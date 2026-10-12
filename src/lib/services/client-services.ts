import type { Address, AuthService, AuthSession, ContactRequest, ContactResponse, CreateOrderRequest, Order, QuoteRequest, User } from "@/types"
import { apiRequest } from "./api-client"
import type { RequestReceipt } from "@/lib/requests/types"

export const authService: AuthService = {
  login: (email, password) => apiRequest<AuthSession>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (data) => apiRequest<AuthSession>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: async () => { await apiRequest<void>("/api/auth/logout", { method: "POST" }) },
  updateProfile: (data) => apiRequest<User>("/api/account/profile", { method: "PUT", body: JSON.stringify(data) }),
  addAddress: (address) => apiRequest<Address>("/api/account/addresses", { method: "POST", body: JSON.stringify(address) }),
  removeAddress: (id) => apiRequest<void>(`/api/account/addresses/${id}`, { method: "DELETE" }),
}

export const orderService = {
  list: () => apiRequest<Order[]>("/api/orders"),
  getById: (id: string) => apiRequest<Order | null>(`/api/orders/${id}`),
  create: (input: CreateOrderRequest) => apiRequest<Order>("/api/orders", { method: "POST", body: JSON.stringify(input) }),
}

export const contactService = {
  create: (request: ContactRequest) => apiRequest<ContactResponse>("/api/contact", { method: "POST", body: JSON.stringify(request) }),
}

export const quoteRequestService = {
  create: (request: QuoteRequest) => apiRequest<RequestReceipt>("/api/quotes", { method: "POST", body: JSON.stringify(request) }),
}

export const customRequestService = {
  create: (payload: FormData) => fetch("/api/custom-requests", { method: "POST", body: payload }).then(async (response) => { const body = (await response.json().catch(() => ({}))) as RequestReceipt; if (!response.ok) throw new Error(body.message ?? "Сервис временно недоступен"); return body }),
}

export const newsletterService = {
  subscribe: (email: string) => apiRequest<{ success: boolean }>("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) }),
}

import type {
  ApiCaseRepository,
  ApiCategoryRepository,
  ApiOrderRepository,
  ApiProductRepository,
  CaseProject,
  Category,
  Company,
  CompanyRepository,
  ContactRequest,
  ContactRequestRepository,
  ContactResponse,
  Customer,
  CustomerRepository,
  File,
  FileRepository,
  FileUploadInput,
  FileUploadResult,
  Order,
  OrderRepository,
  PaginatedResult,
  Product,
  ProductFilters,
  ProductRepository,
  Quote,
  QuoteRepository,
  QuoteRequest,
  QuoteRequestRepository,
  RepositoryQuery,
  Review,
  ReviewRepository,
  SortOption,
  PaginationParams,
} from "@/types"
import { apiClient } from "./api-client"

const query = <TFilters>(value?: RepositoryQuery<TFilters>) => apiClient.query(value)

export const apiProductRepository: ApiProductRepository = {
  list: (filters?: ProductFilters, sort?: SortOption, pagination?: PaginationParams) => apiProductRepository.listPage({ filters, sort, pagination }),
  listPage: (params) => apiClient.request<PaginatedResult<Product>>(`/api/products${query(params)}`),
  getBySlug: (slug) => apiClient.request<Product | null>(`/api/products/slug/${encodeURIComponent(slug)}`),
  getById: (id) => apiClient.request<Product | null>(`/api/products/${encodeURIComponent(id)}`),
  getFeatured: (limit = 4) => apiClient.request<Product[]>(`/api/products/featured?limit=${limit}`),
  getByCategory: (slug, pagination) => apiProductRepository.listPage({ filters: { category: slug }, pagination }),
  search: (search, pagination) => apiProductRepository.listPage({ search, pagination }),
}

export const apiCategoryRepository: ApiCategoryRepository = {
  list: async () => (await apiCategoryRepository.listPage()).items,
  listPage: (params) => apiClient.request<PaginatedResult<Category>>(`/api/categories${query(params)}`),
  getBySlug: (slug) => apiClient.request<Category | null>(`/api/categories/slug/${encodeURIComponent(slug)}`),
  getById: (id) => apiClient.request<Category | null>(`/api/categories/${encodeURIComponent(id)}`),
}

export const apiCaseRepository: ApiCaseRepository = {
  list: (filters, pagination) => apiCaseRepository.listPage({ filters, pagination }),
  listPage: (params) => apiClient.request<PaginatedResult<CaseProject>>(`/api/cases${query(params)}`),
  getBySlug: (slug) => apiClient.request<CaseProject | null>(`/api/cases/slug/${encodeURIComponent(slug)}`),
  getById: (id) => apiClient.request<CaseProject | null>(`/api/cases/${encodeURIComponent(id)}`),
  getCategories: () => apiClient.request<{ name: string; slug: string; count: number }[]>("/api/cases/categories"),
  getRelated: (project, limit = 3) => apiClient.request<CaseProject[]>(`/api/cases/${project.id}/related?limit=${limit}`),
}

export const apiOrderRepository: ApiOrderRepository = {
  list: (userId, pagination) => apiOrderRepository.listPage({ filters: userId ? { customerId: userId } : undefined, pagination }),
  listPage: (params) => apiClient.request<PaginatedResult<Order>>(`/api/orders${query(params)}`),
  getById: (id) => apiClient.request<Order | null>(`/api/orders/${encodeURIComponent(id)}`),
  create: (order) => apiClient.request<Order>("/api/orders", { method: "POST", body: JSON.stringify(order), headers: { "Content-Type": "application/json" } }),
  updateStatus: (id, status) => apiClient.request<Order>(`/api/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } }),
}

export const apiCustomerRepository: CustomerRepository = {
  listPage: (params) => apiClient.request<PaginatedResult<Customer>>(`/api/customers${query(params)}`),
  getById: (id) => apiClient.request<Customer | null>(`/api/customers/${encodeURIComponent(id)}`),
  getByUserId: (userId) => apiClient.request<Customer | null>(`/api/customers/by-user/${encodeURIComponent(userId)}`),
  create: (customer) => apiClient.request<Customer>("/api/customers", { method: "POST", body: JSON.stringify(customer), headers: { "Content-Type": "application/json" } }),
  update: (id, customer) => apiClient.request<Customer>(`/api/customers/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(customer), headers: { "Content-Type": "application/json" } }),
}

export const apiCompanyRepository: CompanyRepository = {
  listPage: (params) => apiClient.request<PaginatedResult<Company>>(`/api/companies${query(params)}`),
  getById: (id) => apiClient.request<Company | null>(`/api/companies/${encodeURIComponent(id)}`),
  create: (company) => apiClient.request<Company>("/api/companies", { method: "POST", body: JSON.stringify(company), headers: { "Content-Type": "application/json" } }),
  update: (id, company) => apiClient.request<Company>(`/api/companies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(company), headers: { "Content-Type": "application/json" } }),
}

export const apiQuoteRequestRepository: QuoteRequestRepository = {
  create: async (request) => apiClient.request<{ requestId: string }>("/api/quote-requests", { method: "POST", body: JSON.stringify(request), headers: { "Content-Type": "application/json" } }),
  list: (params) => apiClient.request<PaginatedResult<QuoteRequest>>(`/api/quote-requests${query(params)}`),
  getById: (id) => apiClient.request<QuoteRequest | null>(`/api/quote-requests/${encodeURIComponent(id)}`),
  updateStatus: (id, status) => apiClient.request<QuoteRequest>(`/api/quote-requests/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } }),
}

export const apiQuoteRepository: QuoteRepository = {
  list: (params) => apiClient.request<PaginatedResult<Quote>>(`/api/quotes${query(params)}`),
  getById: (id) => apiClient.request<Quote | null>(`/api/quotes/${encodeURIComponent(id)}`),
  create: (quote) => apiClient.request<Quote>("/api/quotes", { method: "POST", body: JSON.stringify(quote), headers: { "Content-Type": "application/json" } }),
  updateStatus: (id, status) => apiClient.request<Quote>(`/api/quotes/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } }),
}

export const apiContactRequestRepository: ContactRequestRepository = {
  create: (request) => apiClient.request<ContactResponse>("/api/contact", { method: "POST", body: JSON.stringify(request), headers: { "Content-Type": "application/json" } }),
  list: (params) => apiClient.request<PaginatedResult<ContactRequest>>(`/api/contact-requests${query(params)}`),
  getById: (id) => apiClient.request<ContactRequest | null>(`/api/contact-requests/${encodeURIComponent(id)}`),
}

export const apiReviewRepository: ReviewRepository = {
  listPage: (params) => apiClient.request<PaginatedResult<Review>>(`/api/reviews${query(params)}`),
  getById: (id) => apiClient.request<Review | null>(`/api/reviews/${encodeURIComponent(id)}`),
  create: (review) => apiClient.request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(review), headers: { "Content-Type": "application/json" } }),
  delete: (id) => apiClient.request<void>(`/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }),
}

export const apiFileRepository: FileRepository = {
  createUpload: (input: FileUploadInput) => { const body = new FormData(); body.append("file", input.file, input.originalName); body.append("purpose", input.purpose); body.append("mimeType", input.mimeType); return apiClient.request<FileUploadResult>("/api/files/upload", { method: "POST", body }) },
  completeUpload: (fileId) => apiClient.request<File>(`/api/files/${encodeURIComponent(fileId)}/complete`, { method: "POST" }),
  getById: (id) => apiClient.request<File | null>(`/api/files/${encodeURIComponent(id)}`),
  delete: (id) => apiClient.request<void>(`/api/files/${encodeURIComponent(id)}`, { method: "DELETE" }),
}

export type ApiRepositoryRegistry = {
  products: ProductRepository
  categories: ApiCategoryRepository
  cases: ApiCaseRepository
  orders: OrderRepository
  customers: CustomerRepository
  companies: CompanyRepository
  quoteRequests: QuoteRequestRepository
  quotes: QuoteRepository
  contacts: ContactRequestRepository
  reviews: ReviewRepository
  files: FileRepository
}

export const apiRepositoryRegistry: ApiRepositoryRegistry = {
  products: apiProductRepository,
  categories: apiCategoryRepository,
  cases: apiCaseRepository,
  orders: apiOrderRepository,
  customers: apiCustomerRepository,
  companies: apiCompanyRepository,
  quoteRequests: apiQuoteRequestRepository,
  quotes: apiQuoteRepository,
  contacts: apiContactRequestRepository,
  reviews: apiReviewRepository,
  files: apiFileRepository,
}

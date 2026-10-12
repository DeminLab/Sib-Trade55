// ============================================================================
// Core Ecommerce Types — Backend-Agnostic Data Contract
// ============================================================================

// --- Brand ---

export interface Brand {
  id: string
  name: string
  slug: string
  description: string
}

// --- CMS-style Pages ---

export interface CmsPage {
  id: string
  title: string
  slug: string
  /** Short summary shown on the pages index */
  excerpt?: string
  /** Full HTML content rendered with .blog-body prose */
  body: string
  publishedAt: string
  updatedAt?: string
}

// --- Blog Posts ---

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  author: string
  tags: string[]
  coverImage?: ProductImage
  publishedAt: string
  updatedAt?: string
}

// --- Product ---

export type ProductStatus = "draft" | "active" | "archived"

export interface ProductImage {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface ProductOption {
  name: string // e.g., "Color", "Size"
  value: string // e.g., "Black", "M"
}

export interface VariantInventory {
  quantity: number
  trackInventory: boolean
  allowBackorder: boolean
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  name: string
  price: number // Major currency units
  priceOnRequest?: boolean
  compareAtPrice?: number // original price for sale display
  currency: string
  inventory: VariantInventory
  options: ProductOption[]
  images: ProductImage[]
  weight?: number
  dimensions?: { length: number; width: number; height: number }
}

export interface Product {
  id: string
  name: string
  slug: string
  /** Short blurb shown in the product info column (1–2 sentences) */
  description: string
  /** Full HTML description shown below gallery/add-to-cart (.blog-body prose) */
  body?: string
  images: ProductImage[]
  status: ProductStatus
  brandId: string
  categoryIds: string[]
  tags: string[]
  variants: ProductVariant[]
  rating: number
  reviewCount: number
  featured: boolean
  createdAt: string
  updatedAt: string
}

// --- Category ---

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image?: ProductImage
  parentId?: string
  order: number
}

// --- Cart ---

export interface CartItem {
  id: string
  variantId: string
  productId: string
  name: string
  variantName: string
  image: ProductImage
  slug: string
  price: number
  quantity: number
  lineTotal: number
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

// --- Case studies / Реализованные проекты ---

export interface CaseImage {
  url: string
  alt: string
  width?: number
  height?: number
}

/** Backwards-compatible name used by the current case-study UI. */
export type CaseProjectImage = CaseImage

export interface CaseProjectCharacteristic {
  label: string
  value: string
}

export interface CaseProjectStage {
  title: string
  description: string
}

export interface CaseProject {
  id: string
  title: string
  slug: string
  excerpt: string
  description: string
  task: string
  solution: string
  result: string
  city: string
  year: number
  category: string
  categorySlug: string
  coverImage: CaseProjectImage
  gallery: CaseProjectImage[]
  materials: string[]
  characteristics: CaseProjectCharacteristic[]
  productionStages: CaseProjectStage[]
  featured: boolean
  publishedAt: string
  updatedAt?: string
}

// --- Commercial quotes (B2B) ---

export type QuoteContactMethod = "phone" | "email" | "whatsapp" | "telegram"
export type QuoteRequestStatus = "draft" | "submitted" | "processing" | "completed" | "cancelled"
export type QuoteStatus = "draft" | "sent" | "accepted" | "expired" | "cancelled"

export interface QuoteRequestItem {
  id: string
  productId: string
  variantId: string
  name: string
  variantName: string
  image: ProductImage
  slug: string
  price: number
  priceOnRequest?: boolean
  quantity: number
  lineTotal: number
  currency: string
}

export interface QuoteRequest {
  id?: string
  company: string
  inn: string
  contactName: string
  phone: string
  email: string
  comment: string
  desiredTerm: string
  preferredContact: QuoteContactMethod
  items: QuoteRequestItem[]
  status?: QuoteRequestStatus
  createdAt?: string
}

export interface Quote {
  id: string
  requestId: string
  quoteNumber: string
  company: string
  items: QuoteRequestItem[]
  subtotal: number
  currency: string
  status: QuoteStatus
  validUntil?: string
  comment?: string
  createdAt: string
  updatedAt?: string
}

// --- Order ---

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  name: string
  variantName: string
  sku: string
  image: ProductImage
  price: number
  quantity: number
  total: number
}

/** Backwards-compatible name used by cart and checkout UI. */
export type OrderLineItem = OrderItem

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  items: OrderLineItem[]
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  shippingAddress: Address
  billingAddress?: Address
  customerEmail: string
  customerName: string
  customerPhone?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: OrderLineItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  shippingAddress: Address
  billingAddress?: Address
  customerEmail: string
  customerName: string
  customerPhone?: string
}

export interface AuthSession {
  user: User
  expiresAt?: string
}

export interface Company {
  id: string
  legalName: string
  shortName?: string
  inn: string
  kpp?: string
  ogrn?: string
  legalAddress?: Address
  contactEmail?: string
  contactPhone?: string
  createdAt: string
  updatedAt: string
}

export type CustomerType = "individual" | "company"

export interface Customer {
  id: string
  userId?: string
  type: CustomerType
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  companyId?: string
  company?: Company
  addresses: Address[]
  createdAt: string
  updatedAt: string
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthSession>
  register(data: { firstName: string; lastName: string; email: string; password: string }): Promise<AuthSession>
  logout(): Promise<void>
  updateProfile(data: Partial<Pick<User, "firstName" | "lastName" | "email">>): Promise<User>
  addAddress(address: Omit<Address, "id">): Promise<Address>
  removeAddress(id: string): Promise<void>
}

// --- User ---

export type UserRole = "customer" | "admin"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  addresses: Address[]
  createdAt: string
  updatedAt: string
}

export type AuthenticatedRole = UserRole | "manager" | "production_manager" | "content_manager"

export interface AuthContext {
  userId: string
  customerId?: string
  companyId?: string
  roles: AuthenticatedRole[]
  permissions: string[]
  expiresAt?: string
}

export interface AuthorizationService {
  can(context: AuthContext, permission: string): boolean
  require(context: AuthContext, permission: string): void
}

// --- Address ---

export type AddressType = "shipping" | "billing"

export interface Address {
  id: string
  type: AddressType
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

// --- Payment ---

export type PaymentMethod = "card" | "bank_transfer" | "wallet" | "other"

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  transactionId?: string
  metadata?: Record<string, string>
}

// --- Review (placeholder for v2) ---

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number // 1-5
  title: string
  content: string
  verified: boolean
  createdAt: string
}

export interface File {
  id: string
  storageKey: string
  originalName: string
  mimeType: string
  size: number
  checksum?: string
  url?: string
  uploadedBy?: string
  createdAt: string
}

export interface FileUploadInput {
  file: Blob
  originalName: string
  mimeType: string
  purpose: "custom_request" | "quote_request" | "product" | "case"
}

export interface FileUploadResult {
  file: File
  uploadUrl?: string
  fields?: Record<string, string>
}

// ============================================================================
// Infrastructure Types
// ============================================================================

// --- API Response ---

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: ApiError }

export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, string[]>
}

// --- Pagination ---

export interface PaginationParams {
  page: number
  limit: number
}

export interface RepositoryQuery<TFilters = Record<string, unknown>> {
  pagination?: PaginationParams
  filters?: TFilters
  sort?: SortOption | SortOption[]
  search?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMeta
}

// --- Filtering & Sorting ---

export type SortOrder = "asc" | "desc"

export interface SortOption {
  field: string
  order: SortOrder
}

export interface PriceRange {
  min?: number
  max?: number
}

export interface ProductFilters {
  brandId?: string
  category?: string
  priceRange?: PriceRange
  inStock?: boolean
  search?: string
  tags?: string[]
}

export interface CaseFilters {
  category?: string
  city?: string
  year?: number
  search?: string
}

export interface CategoryFilters {
  parentId?: string
  search?: string
  active?: boolean
}

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[]
  customerId?: string
  companyId?: string
  createdFrom?: string
  createdTo?: string
  search?: string
}

export interface CustomerFilters {
  type?: CustomerType
  companyId?: string
  search?: string
}

export interface QuoteRequestFilters {
  status?: QuoteRequestStatus | QuoteRequestStatus[]
  companyId?: string
  search?: string
}

export interface ReviewFilters {
  productId?: string
  rating?: number
  verified?: boolean
}

// --- Checkout Provider ---

export interface CheckoutSession {
  id: string
  url: string
  status: "open" | "complete" | "expired"
  orderId?: string
  metadata?: Record<string, string>
}

export interface WebhookResult {
  success: boolean
  orderId?: string
  error?: string
}

export interface CheckoutProvider {
  createSession(
    cart: Cart,
    customer?: { email: string; shippingAddress?: Address }
  ): Promise<CheckoutSession>
  getSession(sessionId: string): Promise<CheckoutSession>
  handleWebhook(
    payload: unknown,
    signature: string
  ): Promise<WebhookResult>
}

// --- Data Repository Interfaces ---

export interface ProductRepository {
  list(
    filters?: ProductFilters,
    sort?: SortOption,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Product>>
  getBySlug(slug: string): Promise<Product | null>
  getById(id: string): Promise<Product | null>
  getFeatured(limit?: number): Promise<Product[]>
  getByCategory(
    categorySlug: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Product>>
  search(
    query: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Product>>
}

export interface ListQueryRepository<TEntity, TFilters = Record<string, unknown>> {
  listPage(query?: RepositoryQuery<TFilters>): Promise<PaginatedResult<TEntity>>
}

export interface ApiProductRepository extends ProductRepository, ListQueryRepository<Product, ProductFilters> {}

export interface CategoryRepository {
  list(): Promise<Category[]>
  getBySlug(slug: string): Promise<Category | null>
  getById(id: string): Promise<Category | null>
}

export interface ApiCategoryRepository extends CategoryRepository, ListQueryRepository<Category, CategoryFilters> {}

export interface CaseRepository {
  list(
    filters?: CaseFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CaseProject>>
  getBySlug(slug: string): Promise<CaseProject | null>
  getById(id: string): Promise<CaseProject | null>
  getCategories(): Promise<{ name: string; slug: string; count: number }[]>
  getRelated(project: CaseProject, limit?: number): Promise<CaseProject[]>
}

export interface ApiCaseRepository extends CaseRepository, ListQueryRepository<CaseProject, CaseFilters> {}

// --- Materials and finishes ---

export type MaterialSpecKind = "material" | "coating"

export interface MaterialSpec {
  id: string
  slug: string
  name: string
  kind: MaterialSpecKind
  summary: string
  properties: string[]
  applications: string[]
  advantages: string[]
  limitations: string[]
  technicalData: { label: string; value: string }[]
}

export interface RalColor {
  code: string
  name: string
  hex: string
  group: string
}

export interface MaterialRepository {
  listMaterials(): Promise<MaterialSpec[]>
  listCoatings(): Promise<MaterialSpec[]>
  listRalColors(): Promise<RalColor[]>
}

// --- Contact requests ---

export type ContactPreferredMethod = "phone" | "email" | "whatsapp" | "telegram"

export interface ContactRequest {
  name: string
  company?: string
  phone?: string
  email: string
  subject: string
  message: string
  preferredContact: ContactPreferredMethod
}

export interface ContactResponse {
  success: boolean
  requestId: string
  message: string
}

export interface OrderRepository {
  list(
    userId?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Order>>
  getById(id: string): Promise<Order | null>
  create(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>
  updateStatus(id: string, status: OrderStatus): Promise<Order>
}

export interface ApiOrderRepository extends OrderRepository, ListQueryRepository<Order, OrderFilters> {}

export interface OrderService {
  list(userId?: string): Promise<Order[]>
  getById(id: string): Promise<Order | null>
  create(input: CreateOrderRequest): Promise<Order>
}

export interface ContactRepository {
  create(request: ContactRequest): Promise<ContactResponse>
}

export interface ContactRequestRepository extends ContactRepository {
  list(query?: RepositoryQuery<{ search?: string }>): Promise<PaginatedResult<ContactRequest>>
  getById(id: string): Promise<ContactRequest | null>
}

export interface QuoteRequestRepository {
  create(request: QuoteRequest): Promise<{ requestId: string }>
  list(query?: RepositoryQuery<QuoteRequestFilters>): Promise<PaginatedResult<QuoteRequest>>
  getById(id: string): Promise<QuoteRequest | null>
  updateStatus(id: string, status: QuoteRequestStatus): Promise<QuoteRequest>
}

export interface QuoteRepository {
  list(query?: RepositoryQuery<{ status?: QuoteStatus | QuoteStatus[]; companyId?: string }>): Promise<PaginatedResult<Quote>>
  getById(id: string): Promise<Quote | null>
  create(quote: Omit<Quote, "id" | "createdAt" | "updatedAt">): Promise<Quote>
  updateStatus(id: string, status: QuoteStatus): Promise<Quote>
}

export interface CustomerRepository extends ListQueryRepository<Customer, CustomerFilters> {
  getById(id: string): Promise<Customer | null>
  getByUserId(userId: string): Promise<Customer | null>
  create(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>
  update(id: string, customer: Partial<Customer>): Promise<Customer>
}

export interface CompanyRepository extends ListQueryRepository<Company, { search?: string }> {
  getById(id: string): Promise<Company | null>
  create(company: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<Company>
  update(id: string, company: Partial<Company>): Promise<Company>
}

export interface ReviewRepository extends ListQueryRepository<Review, ReviewFilters> {
  getById(id: string): Promise<Review | null>
  create(review: Omit<Review, "id" | "createdAt">): Promise<Review>
  delete(id: string): Promise<void>
}

export interface FileRepository {
  createUpload(input: FileUploadInput): Promise<FileUploadResult>
  completeUpload(fileId: string): Promise<File>
  getById(id: string): Promise<File | null>
  delete(id: string): Promise<void>
}

// --- Admin dashboard ---

export interface AdminMetric {
  id: string
  label: string
  value: string
}

export interface AdminDashboardProduct {
  id: string
  name: string
  status: ProductStatus
  updatedAt: string
  variants: number
  price: number | null
  priceOnRequest: boolean
}

export interface AdminDashboardSnapshot {
  metrics: AdminMetric[]
  catalog: {
    categoryCount: number
    outOfStockCount: number
    recentProducts: AdminDashboardProduct[]
  }
}

export interface AdminRepository {
  getDashboard(): Promise<AdminDashboardSnapshot>
}

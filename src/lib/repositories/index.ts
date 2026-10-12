// Re-export the SQLite-backed domain repositories as the default implementations.

export { sqliteProductRepository as productRepository } from "./sqlite-product-repository"
export { sqliteCategoryRepository as categoryRepository } from "./sqlite-category-repository"
export { sqliteBrandRepository as brandRepository } from "./sqlite-brand-repository"
export { sqlitePageRepository as pageRepository } from "./sqlite-page-repository"
export { sqliteBlogRepository as blogRepository } from "./sqlite-blog-repository"
export { sqliteCaseRepository as caseRepository } from "./sqlite-case-repository"
export { sqliteMaterialRepository as materialRepository } from "./sqlite-material-repository"
export { catalogAdminRepository as adminRepository } from "./catalog-admin-repository"
export {
  apiCaseRepository,
  apiCategoryRepository,
  apiCompanyRepository,
  apiContactRequestRepository,
  apiCustomerRepository,
  apiFileRepository,
  apiOrderRepository,
  apiProductRepository,
  apiQuoteRepository,
  apiQuoteRequestRepository,
  apiRepositoryRegistry,
  apiReviewRepository,
} from "./api-repositories"

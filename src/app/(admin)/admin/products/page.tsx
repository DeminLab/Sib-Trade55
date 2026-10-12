import { AdminProductsManager } from "@/components/admin/catalog/admin-products-manager"

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ categoryId?: string; productId?: string; q?: string; status?: string; brandId?: string; sort?: string; availability?: string; pricing?: string; archive?: string; page?: string }> }) {
  const filters = await searchParams
  return <AdminProductsManager initialFilters={filters} />
}

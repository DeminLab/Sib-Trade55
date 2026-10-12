import { AdminProductsManager } from "@/components/admin/catalog/admin-products-manager"

type ProductListFilters = {
  q?: string
  categoryId?: string
  status?: string
  brandId?: string
  sort?: string
  availability?: string
  pricing?: string
  archive?: string
  page?: string
}

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<ProductListFilters>
}) {
  const [{ id }, filters] = await Promise.all([params, searchParams])
  return <AdminProductsManager initialFilters={{ ...filters, productId: id }} />
}

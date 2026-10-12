import { AdminCategoriesManager } from "@/components/admin/catalog/admin-categories-manager"

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return <AdminCategoriesManager initialQuery={q} />
}

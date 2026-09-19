import { Tags } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"
import { categoryRepository } from "@/lib/repositories"

export default async function AdminCategoriesPage() {
  const categories = await categoryRepository.list()
  return <AdminSectionPage eyebrow="Каталог / структура" title="Категории" description="Структура каталога, направления поставки и товарные группы." icon={Tags} rows={categories.map((category) => ({ id: category.id, title: category.name, meta: category.description, value: category.slug, status: "Активна" }))} />
}

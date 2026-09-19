import { FolderKanban } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"
import { caseRepository } from "@/lib/repositories"

export default async function AdminPortfolioPage() {
  const result = await caseRepository.list(undefined, { page: 1, limit: 12 })
  return <AdminSectionPage eyebrow="Контент / проекты" title="Портфолио" description="Реализованные проекты СИБ-ТРЕЙД, которые показывают опыт поставки и монтажа." icon={FolderKanban} rows={result.items.map((project) => ({ id: project.id, title: project.title, meta: `${project.city} · ${project.year}`, value: project.category, status: "Опубликован" }))} />
}

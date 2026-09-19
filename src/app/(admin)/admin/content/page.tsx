import { FileText } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"
import { blogRepository, pageRepository } from "@/lib/repositories"

export default async function AdminContentPage() {
  const [pages, posts] = await Promise.all([pageRepository.list(), blogRepository.list()])
  const rows = [...pages.map((page) => ({ id: page.id, title: page.title, meta: `CMS-страница · ${page.slug}`, value: "Страница", status: "Опубликована" })), ...posts.items.slice(0, 6).map((post) => ({ id: post.id, title: post.title, meta: `Блог · ${post.author}`, value: "Публикация", status: "Опубликована" }))]
  return <AdminSectionPage eyebrow="CMS / публикации" title="Контент" description="CMS-страницы и материалы блога. Контентные источники уже отделены repository-интерфейсами для дальнейшего подключения CMS." icon={FileText} rows={rows} />
}

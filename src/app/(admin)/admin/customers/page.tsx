import { Users } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"

export default async function AdminCustomersPage() {
  return <AdminSectionPage eyebrow="Продажи / клиенты" title="Клиенты" description="B2B-клиенты, история заказов и дальнейшая работа менеджеров. Контракт можно заменить на API или CRM без изменения интерфейса." icon={Users} rows={[]} emptyMessage="Клиенты появятся после подключения customer API." />
}

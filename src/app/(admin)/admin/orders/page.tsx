import { Package } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"

export default async function AdminOrdersPage() {
  return <AdminSectionPage eyebrow="Продажи / заказы" title="Заказы" description="Заказы клиентов, статусы исполнения и контроль менеджеров. Источник данных изолирован repository-слоем для подключения API." icon={Package} rows={[]} emptyMessage="Заказы появятся после подключения order API." />
}

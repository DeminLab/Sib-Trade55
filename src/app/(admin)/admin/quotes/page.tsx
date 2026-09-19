import { ClipboardList } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"

export default function AdminQuotesPage() {
  return <AdminSectionPage eyebrow="B2B / продажи" title="Запросы КП" description="Запросы коммерческих предложений с составом товаров, количеством и контактами клиента. Подключение repository к backend предусмотрено контрактами QuoteRequest и Quote." icon={ClipboardList} rows={[]} emptyMessage="Новые запросы КП появятся здесь после подключения API-репозитория." />
}

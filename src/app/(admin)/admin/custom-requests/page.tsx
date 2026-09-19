import { BriefcaseBusiness } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"

export default function AdminCustomRequestsPage() {
  return <AdminSectionPage eyebrow="Поставка / заявки" title="Заявки на подбор и поставку" description="Задачи по чертежам, фотографиям и техническим заданиям. Здесь будет вестись согласование, расчёт и запуск поставки." icon={BriefcaseBusiness} rows={[]} emptyMessage="Заявки на подбор и поставку появятся здесь после подключения API-репозитория." />
}

import { Users } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminCustomersPage() {
  return (
    <div>
      <PageHeader title="Клиенты" description="Просмотр и управление базой клиентов." />
      <EmptyState
        icon={Users}
title="Клиентов пока нет"
        description="Данные появятся после регистрации пользователей."
      />
    </div>
  )
}

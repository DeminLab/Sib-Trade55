import { Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminOrdersPage() {
  return (
    <div>
      <PageHeader title="Заказы" description="Управление заказами клиентов." />
      <EmptyState
        icon={Package}
title="Заказов пока нет"
        description="Они появятся здесь после первых покупок."
      />
    </div>
  )
}

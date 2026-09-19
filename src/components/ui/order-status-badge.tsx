import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-status-pending-bg text-status-pending-text",
  processing: "bg-status-processing-bg text-status-processing-text",
  shipped: "bg-status-shipped-bg text-status-shipped-text",
  delivered: "bg-status-delivered-bg text-status-delivered-text",
  cancelled: "bg-status-cancelled-bg text-status-cancelled-text",
  refunded: "bg-status-refunded-bg text-status-refunded-text",
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Ожидание",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
  refunded: "Возвращён",
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge className={statusStyles[status] ?? ""} variant="secondary">
      {statusLabels[status] ?? status}
    </Badge>
  )
}

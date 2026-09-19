"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { useEffect } from "react"
import { useOrdersStore } from "@/store/orders"
import { formatPrice, formatDate } from "@/lib/utils"

export default function OrdersPage() {
  const { user, isReady } = useAuthGuard()
  const orders = useOrdersStore((s) => s.orders)
  const loadOrders = useOrdersStore((s) => s.loadOrders)
  const loading = useOrdersStore((s) => s.loading)
  const error = useOrdersStore((s) => s.error)

  useEffect(() => { if (isReady) void loadOrders() }, [isReady, loadOrders])

  if (!isReady) return null

  const userOrders = user
    ? orders.filter((o) => o.customerEmail === user.email)
    : orders

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
title="История заказов"
        description={userOrders.length > 0 ? `${userOrders.length} ${userOrders.length === 1 ? "заказ" : "заказов"}` : undefined}
      />

      {error ? <EmptyState icon={Package} title="История заказов недоступна" description={error} /> : loading ? <p className="mt-8 text-sm text-muted-foreground">Загружаем заказы…</p> : userOrders.length === 0 ? (
        <EmptyState
          icon={Package}
title="Заказов пока нет"
          description="Ваши заказы появятся здесь после оформления."
          actionLabel="Начать покупки"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {userOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <span key={item.id} className="mr-3">
                      {item.name} &times; {item.quantity}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

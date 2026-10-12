"use client"

import { useCallback, useEffect, useState } from "react"
import { Package, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import type { Order } from "@/types"
import { formatDate, formatPrice } from "@/lib/utils"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState('')
  const statusNames = { pending: 'Новая', processing: 'В работе', shipped: 'Отгружена', delivered: 'Доставлена', cancelled: 'Отменена', refunded: 'Возврат' }
  const filtered = orders.filter(order => (!status || order.status === status) && `${order.orderNumber} ${order.customerName} ${order.customerEmail} ${order.customerPhone ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  async function updateStatus(order: Order, next: Order['status']) {
    if (['cancelled', 'refunded'].includes(next) && !window.confirm('Изменить статус заявки? Её данные сохранятся.')) return
    setSaving(order.id); setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
      const body = await res.json(); if (!res.ok) throw new Error(body.message)
      setOrders(current => current.map(o => o.id === body.id ? body : o))
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось изменить статус') }
    finally { setSaving('') }
  }

  const loadOrders = useCallback((silent = false) => fetch("/api/orders", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => ({})) as Order[] | { message?: string }
      if (!response.ok) throw new Error(!Array.isArray(body) ? body.message : "Не удалось загрузить заявки")
      setError(null)
      setOrders(Array.isArray(body) ? body : [])
    }).catch(cause => {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить заявки")
    }).finally(() => { if (!silent) setLoading(false) }), [])

  useEffect(() => {
    void loadOrders()
    const timer = window.setInterval(() => { void loadOrders(true) }, 30_000)
    return () => window.clearInterval(timer)
  }, [loadOrders])

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="industrial-label">Продажи / заявки</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Заказы</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Заявки из корзины. Клиент отправляет запрос на заказ, оплата на сайте не принимается.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => { setLoading(true); void loadOrders() }} disabled={loading}>
          <RefreshCw className="mr-2 size-4" /> Обновить
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Поиск заказов</span><input className="min-h-11 w-full border border-input bg-background px-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="Номер, покупатель, телефон или email…" /></label><label><span className="sr-only">Фильтр статуса</span><select className="min-h-11 w-full border border-input bg-background px-3" value={status} onChange={e => setStatus(e.target.value)}><option value="">Все статусы</option>{Object.entries(statusNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label></div>
      {error ? <Card><CardContent role="alert" className="py-8 text-sm text-destructive">{error}</CardContent></Card> : null}
      {loading ? <p className="text-sm text-muted-foreground">Загружаем заявки…</p> : null}
      {!loading && !error && orders.length === 0 ? <Card><CardContent className="flex flex-col items-center py-14 text-center"><Package className="size-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">Заявок пока нет</h2><p className="mt-2 text-sm text-muted-foreground">Когда клиент отправит заказ, он появится здесь.</p></CardContent></Card> : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">{order.orderNumber}</h2><OrderStatusBadge status={order.status} /></div>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    <label className="mt-3 flex items-center gap-2 text-sm">Статус<select className="min-h-11 border border-input bg-background px-3" aria-label={`Статус ${order.orderNumber}`} value={order.status} disabled={Boolean(saving)} onChange={e => void updateStatus(order, e.target.value as Order['status'])}>{Object.entries(statusNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
                  </div>
                  <p className="text-lg font-semibold">{formatPrice(order.total)} <span className="text-xs font-normal text-muted-foreground">предварительно</span></p>
                </div>

                <div className="grid gap-4 border-y border-border py-4 text-sm sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Покупатель</p><p className="mt-1 font-medium">{order.customerName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><a className="mt-1 inline-block font-medium hover:underline" href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></div>
                  <div><p className="text-xs text-muted-foreground">Телефон</p>{order.customerPhone ? <a className="mt-1 inline-block font-medium hover:underline" href={`tel:${order.customerPhone}`}>{order.customerPhone}</a> : <p className="mt-1 text-muted-foreground">Не указан</p>}</div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Позиции и доставка</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {order.items.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{item.name} × {item.quantity}</span><span className="shrink-0">{formatPrice(item.total)}</span></li>)}
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.postalCode}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {!loading && !error && orders.length > 0 && filtered.length === 0 && <p role="status">Заявки по выбранным условиям не найдены.</p>}
    </div>
  )
}

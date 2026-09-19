import Link from "next/link"
import { ArrowUpRight, Boxes, ClipboardList, Package, TrendingUp, Users } from "lucide-react"

import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { adminRepository } from "@/lib/repositories"

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })

export default async function AdminDashboardPage() {
  let dashboard: Awaited<ReturnType<typeof adminRepository.getDashboard>> | null = null
  let errorMessage = ""
  try {
    dashboard = await adminRepository.getDashboard()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Данные dashboard недоступны"
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">СИБ-ТРЕЙД / управление</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Обзор</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Ключевые показатели и текущая активность компании.</p>
        </div>
        <div className="text-sm text-muted-foreground">Данные за текущий период · обновлено сегодня</div>
      </header>

      {errorMessage && <div role="status" className="border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-foreground">{errorMessage}. Подключите backend repository, чтобы увидеть актуальные показатели.</div>}

      {!dashboard ? <section className="border border-border bg-background px-6 py-16 text-center"><Boxes className="mx-auto size-8 text-primary" /><h2 className="mt-5 text-xl font-semibold">Нет данных для обзора</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Dashboard не генерирует demo-метрики. После подключения admin API здесь появятся выручка, заказы, заявки и рабочие таблицы.</p></section> : <>
      <section aria-label="Ключевые показатели" className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric, index) => {
          const Icon = [TrendingUp, Package, Users, ClipboardList][index] ?? TrendingUp
          return (
            <div key={metric.id} className="bg-background p-6">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{metric.label}</p><Icon className="size-5 text-primary" /></div>
              <p className="mt-7 text-3xl font-semibold tracking-[-0.05em]">{metric.value}</p>
              <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><span>↗ {metric.change}</span><span className="font-normal text-muted-foreground">к прошлому периоду</span></p>
            </div>
          )
        })}
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <DataPanel title="Популярные товары" href="/admin/products" icon={Boxes}>
          <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground"><th className="px-5 py-3">Товар</th><th className="px-3 py-3 text-right">Продано</th><th className="px-5 py-3 text-right">Выручка</th></tr></thead><tbody>{dashboard.popularProducts.map((product) => <tr key={product.productId} className="border-b border-border last:border-0 hover:bg-surface-subtle"><td className="px-5 py-4"><Link href="/shop" className="font-medium hover:text-primary">{product.name}</Link><span className="mt-1 block text-xs text-muted-foreground">{product.category}</span></td><td className="px-3 py-4 text-right tabular-nums">{product.unitsSold} шт.</td><td className="px-5 py-4 text-right font-medium tabular-nums">{currency.format(product.revenue)}</td></tr>)}</tbody></table>
        </DataPanel>

        <DataPanel title="Низкий остаток" href="/admin/products" icon={Package}>
          <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground"><th className="px-5 py-3">Товар</th><th className="px-3 py-3 text-right">Остаток</th><th className="px-5 py-3 text-right">Мин. остаток</th></tr></thead><tbody>{dashboard.lowStockProducts.map((product) => <tr key={product.productId} className="border-b border-border last:border-0 hover:bg-surface-subtle"><td className="px-5 py-4 font-medium">{product.name}<span className="mt-1 block text-xs font-semibold text-primary">{product.status === "out" ? "Нет в наличии" : "Нужно пополнить"}</span></td><td className="px-3 py-4 text-right font-semibold tabular-nums">{product.stock} шт.</td><td className="px-5 py-4 text-right text-muted-foreground tabular-nums">{product.minimum} шт.</td></tr>)}</tbody></table>
        </DataPanel>
      </div>

      <DataPanel title="Последние заказы" href="/admin/orders" icon={Package}>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground"><th className="px-5 py-3">№ заказа</th><th className="px-3 py-3">Дата</th><th className="px-3 py-3">Клиент</th><th className="px-3 py-3 text-right">Состав</th><th className="px-3 py-3 text-right">Сумма</th><th className="px-3 py-3">Статус</th><th className="px-5 py-3">Менеджер</th></tr></thead><tbody>{dashboard.recentOrders.map((order) => <tr key={order.orderNumber} className="border-b border-border last:border-0 hover:bg-surface-subtle"><td className="px-5 py-4 font-semibold">{order.orderNumber}</td><td className="px-3 py-4 text-muted-foreground">{order.date}</td><td className="px-3 py-4 font-medium">{order.customer}</td><td className="px-3 py-4 text-right tabular-nums">{order.itemCount} поз.</td><td className="px-3 py-4 text-right font-medium tabular-nums">{currency.format(order.total)}</td><td className="px-3 py-4"><OrderStatusBadge status={order.status} /></td><td className="px-5 py-4 text-muted-foreground">{order.manager}</td></tr>)}</tbody></table></div>
      </DataPanel>
      </>}
    </div>
  )
}

function DataPanel({ title, href, icon: Icon, children }: { title: string; href: string; icon: typeof Boxes; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-5"><div className="flex items-center gap-3"><Icon className="size-5 text-primary" /><h2 className="text-lg font-semibold tracking-[-0.03em]">{title}</h2></div><Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Открыть <ArrowUpRight className="size-3.5" /></Link></div>
      {children}
    </section>
  )
}

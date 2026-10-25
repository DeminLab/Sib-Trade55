import Link from "next/link"
import { Activity, ArrowUpRight, Archive, Boxes, BriefcaseBusiness, CircleAlert, ClipboardList, FileEdit, Package, PackageCheck } from "lucide-react"

import { adminRepository } from "@/lib/repositories"
import { BusinessOverview } from '@/components/admin/business-overview'

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" })
const statusLabels = { active: "Опубликован", draft: "Черновик", archived: "В архиве" } as const
const shortcuts = [
  { href: "/admin/orders", title: "Заказы", description: "Проверить и обновить статусы", icon: Package },
  { href: "/admin/contacts", title: "Новые обращения", description: "Связаться с клиентами", icon: ClipboardList },
  { href: "/admin/custom-requests", title: "Заявки на подбор", description: "Обработать запросы на поставку", icon: BriefcaseBusiness },
  { href: "/admin/visitors", title: "Посещения", description: "Устройства, источники и время", icon: Activity },
]

export default async function AdminDashboardPage() {
  const dashboard = await adminRepository.getDashboard()
  const icons = [Boxes, PackageCheck, FileEdit, Archive]

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">СИБ-ТРЕЙД / управление</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Обзор</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Быстрый доступ к ежедневным задачам и состояние каталога.</p>
        </div>
        <Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center gap-2 self-start bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:self-auto">
          Перейти в каталог <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <section aria-label="Быстрые действия">
        <div className="mb-3"><h2 className="text-base font-semibold">Быстрые действия</h2><p className="mt-1 text-sm text-muted-foreground">Основные разделы, к которым чаще всего нужно перейти.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-24 items-start gap-3 border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="flex size-9 shrink-0 items-center justify-center border border-primary/25 bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-4" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold group-hover:text-primary">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
          </Link>)}
        </div>
      </section>

      <section aria-label="Показатели каталога" className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric, index) => {
          const Icon = icons[index] ?? Boxes
          return (
            <article key={metric.id} className="bg-background p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{metric.label}</p><Icon aria-hidden="true" className="size-5 shrink-0 text-primary" /></div>
              <p className="mt-6 text-3xl font-semibold tracking-[-0.05em] tabular-nums">{metric.value}</p>
            </article>
          )
        })}
      </section>

      <div role="status" className="flex gap-3 border border-border bg-surface-subtle px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5">
        <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
        <p>Категорий: <span className="font-semibold text-foreground">{dashboard.catalog.categoryCount}</span>. Товаров без остатка: <span className="font-semibold text-foreground">{dashboard.catalog.outOfStockCount}</span>. Заявки и показатели ниже читаются из текущей SQLite базы.</p>
      </div>

      <BusinessOverview />
      <section className="overflow-hidden border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-semibold tracking-[-0.03em]">Недавно обновлённые товары</h2><p className="mt-1 text-sm text-muted-foreground">Последние изменения в каталоге</p></div>
          <Link href="/admin/products" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline">Все товары <ArrowUpRight className="size-3.5" /></Link>
        </div>
        {dashboard.catalog.recentProducts.length === 0 ? (
          <p role="status" className="px-5 py-12 text-center text-sm text-muted-foreground">В каталоге пока нет товаров.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground"><th className="px-5 py-3">Товар</th><th className="px-3 py-3">Статус</th><th className="px-3 py-3 text-right">Варианты</th><th className="px-3 py-3 text-right">Цена</th><th className="px-5 py-3 text-right">Изменён</th></tr></thead>
              <tbody>{dashboard.catalog.recentProducts.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-subtle">
                  <td className="px-5 py-4"><Link href="/admin/products" className="font-medium hover:text-primary">{product.name}</Link></td>
                  <td className="px-3 py-4 text-muted-foreground">{statusLabels[product.status]}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{product.variants}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{product.priceOnRequest || product.price === null ? "По запросу" : currency.format(product.price)}</td>
                  <td className="px-5 py-4 text-right text-muted-foreground">{dateFormat.format(new Date(product.updatedAt))}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import Image from "@/components/ui/catalog-image"
import { ArrowRight, FileText, Minus, Plus, Trash2 } from "lucide-react"

import { QuoteRequestForm } from "@/components/quote/quote-request-form"
import { Button } from "@/components/ui/button"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { SalesContact } from "@/components/quote/sales-contact"
import { useQuoteStore } from "@/store/quote"

export function QuotePageClient() {
  const [confirmation, setConfirmation] = useState("")
  const items = useQuoteStore((state) => state.items)
  const removeItem = useQuoteStore((state) => state.removeItem)
  const updateQuantity = useQuoteStore((state) => state.updateQuantity)
  const clear = useQuoteStore((state) => state.clear)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!mounted) return <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12"><div className="h-10 w-72 animate-pulse bg-muted" /></div>


  if (confirmation) return <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8"><h1 className="text-3xl font-semibold">Запрос КП принят</h1><p className="mt-5 text-base leading-7" role="status">{confirmation}</p><Button className="mt-8" asChild><Link href="/shop">Вернуться в каталог</Link></Button></div>

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <FileText className="mx-auto size-10 text-primary" />
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em]">Запрос коммерческого предложения</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Добавьте товары из каталога, чтобы отправить их единым списком на расчёт для вашего проекта.</p>
        <Button className="mt-8" asChild><Link href="/shop">Перейти в каталог <ArrowRight className="ml-2 size-4" /></Link></Button><SalesContact />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="max-w-3xl"><p className="industrial-label">Подборка товаров</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Заявка на расчёт</h1><p className="mt-5 text-base leading-7 text-muted-foreground">Проверьте состав заявки, укажите контакты и желаемые условия. Мы подготовим расчёт и свяжемся удобным способом.</p></div>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="order-2 lg:order-1"><QuoteRequestForm items={items} onSuccess={(receipt) => { setConfirmation(receipt?.message ?? "Мы свяжемся с вами для уточнения деталей."); clear() }} /></div>
        <aside className="order-1 lg:order-2 border border-border bg-surface-subtle p-5 lg:sticky lg:top-28 sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5"><div><p className="industrial-label">Состав заявки</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Выбранные товары</h2></div><span className="font-mono text-xs text-muted-foreground">{items.reduce((sum, item) => sum + item.quantity, 0)} шт.</span></div>
          <Link href="/shop" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Добавить ещё товары <ArrowRight className="size-4" /></Link>
          <div className="divide-y divide-border">{items.map((item) => <div key={item.variantId} className="flex gap-4 py-5"><div className="relative size-16 shrink-0 overflow-hidden bg-background"><Image src={item.image.url || PLACEHOLDER_IMAGE} alt={item.image.alt || item.name} fill className="object-contain" sizes="64px" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><Link href={`/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">{item.name}</Link><button type="button" onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-foreground" aria-label={`Удалить ${item.name}`}><Trash2 className="size-4" /></button></div><p className="mt-1 text-xs text-muted-foreground">{item.variantName} · Цена индивидуально</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center border border-border bg-background"><button type="button" className="grid size-11 place-items-center text-muted-foreground hover:text-foreground" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Уменьшить количество"><Minus className="size-3" /></button><span className="min-w-8 text-center text-xs font-medium">{item.quantity}</span><button type="button" className="grid size-11 place-items-center text-muted-foreground hover:text-foreground" disabled={item.quantity >= 10000} onClick={() => updateQuantity(item.variantId, item.quantity + 1)} aria-label="Увеличить количество"><Plus className="size-3" /></button></div><span className="text-sm font-semibold"></span></div></div></div>)}</div>
          <div className="border-t border-border pt-5"><p className="font-semibold">Стоимость согласуем индивидуально</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Учтём количество, исполнение и адрес доставки. После заявки обсудим условия и подготовим предложение.</p><SalesContact /></div>
        </aside>
      </div>
    </div>
  )
}

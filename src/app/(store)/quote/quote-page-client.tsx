"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Minus, Plus, Trash2 } from "lucide-react"

import { QuoteRequestForm } from "@/components/quote/quote-request-form"
import { Button } from "@/components/ui/button"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { formatPrice } from "@/lib/utils"
import { useQuoteStore } from "@/store/quote"

export function QuotePageClient() {
  const items = useQuoteStore((state) => state.items)
  const getSubtotal = useQuoteStore((state) => state.getSubtotal)
  const removeItem = useQuoteStore((state) => state.removeItem)
  const updateQuantity = useQuoteStore((state) => state.updateQuantity)
  const clear = useQuoteStore((state) => state.clear)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!mounted) return <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12"><div className="h-10 w-72 animate-pulse bg-muted" /></div>

  const subtotal = getSubtotal()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <FileText className="mx-auto size-10 text-primary" />
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em]">Запрос коммерческого предложения</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Добавьте товары из каталога, чтобы отправить их единым списком на расчёт для вашей компании.</p>
        <Button className="mt-8" asChild><Link href="/shop">Перейти в каталог <ArrowRight className="ml-2 size-4" /></Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="max-w-3xl"><p className="industrial-label">B2B / коммерческое предложение</p><h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">Запросить КП</h1><p className="mt-5 text-base leading-7 text-muted-foreground">Проверьте состав заявки, укажите реквизиты компании и желаемые условия. Мы подготовим расчёт и свяжемся удобным способом.</p></div>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <QuoteRequestForm items={items} onSuccess={clear} />
        <aside className="border border-border bg-surface-subtle p-5 lg:sticky lg:top-28 sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5"><div><p className="industrial-label">Состав заявки</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Товары для КП</h2></div><span className="font-mono text-xs text-muted-foreground">{items.reduce((sum, item) => sum + item.quantity, 0)} шт.</span></div>
          <div className="divide-y divide-border">{items.map((item) => <div key={item.variantId} className="flex gap-4 py-5"><div className="relative size-16 shrink-0 overflow-hidden bg-background"><Image src={item.image.url || PLACEHOLDER_IMAGE} alt={item.image.alt || item.name} fill className="object-cover" sizes="64px" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><Link href={`/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">{item.name}</Link><button type="button" onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-foreground" aria-label={`Удалить ${item.name}`}><Trash2 className="size-4" /></button></div><p className="mt-1 text-xs text-muted-foreground">{item.variantName} · {formatPrice(item.price, item.currency)} / шт.</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center border border-border bg-background"><button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Уменьшить количество"><Minus className="size-3" /></button><span className="min-w-8 text-center text-xs font-medium">{item.quantity}</span><button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} aria-label="Увеличить количество"><Plus className="size-3" /></button></div><span className="text-sm font-semibold">{formatPrice(item.lineTotal, item.currency)}</span></div></div></div>)}</div>
          <div className="border-t border-border pt-5"><div className="flex items-end justify-between gap-4"><span className="text-sm text-muted-foreground">Ориентировочная стоимость</span><span className="text-2xl font-semibold tracking-[-0.04em]">{formatPrice(subtotal, items[0]?.currency)}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Итоговая стоимость уточняется после проверки размеров, материалов, покрытия и условий поставки.</p></div>
        </aside>
      </div>
    </div>
  )
}

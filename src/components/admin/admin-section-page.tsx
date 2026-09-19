import type { LucideIcon } from "lucide-react"

interface AdminSectionRow {
  id: string
  title: string
  meta: string
  value?: string
  status?: string
}

interface AdminSectionPageProps {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  rows: AdminSectionRow[]
  emptyMessage?: string
}

export function AdminSectionPage({ eyebrow, title, description, icon: Icon, rows, emptyMessage = "Записей пока нет" }: AdminSectionPageProps) {
  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-7">
        <div className="flex items-start gap-4"><div className="mt-1 flex size-11 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><Icon className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div></div>
      </header>
      <section className="overflow-hidden border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-5 py-5"><h2 className="font-semibold">Рабочий список</h2><span className="text-xs text-muted-foreground">{rows.length} записей</span></div>
        {rows.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground"><th className="px-5 py-3">Наименование</th><th className="px-3 py-3">Описание</th><th className="px-3 py-3">Статус</th><th className="px-5 py-3 text-right">Значение</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-subtle"><td className="px-5 py-4 font-medium">{row.title}</td><td className="px-3 py-4 text-muted-foreground">{row.meta}</td><td className="px-3 py-4"><span className="text-xs font-semibold text-primary">{row.status ?? "Готово к обработке"}</span></td><td className="px-5 py-4 text-right font-medium">{row.value ?? "—"}</td></tr>)}</tbody></table></div> : <div className="px-5 py-16 text-center text-sm text-muted-foreground">{emptyMessage}</div>}
      </section>
    </div>
  )
}

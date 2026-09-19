import { AlertTriangle, Check, Ruler } from "lucide-react"
import type { MaterialSpec } from "@/types"

export function MaterialSpecCard({ item }: { item: MaterialSpec }) {
  return (
    <article className="border border-border bg-background p-6 sm:p-7">
      <div className="flex items-start justify-between gap-5 border-b border-border pb-5"><div><p className="industrial-label">{item.kind === "material" ? "Материал" : "Покрытие"}</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{item.name}</h3></div><span className="font-mono text-xs text-muted-foreground">{item.slug}</span></div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">{item.summary}</p>
      <dl className="mt-6 border-y border-border">{item.technicalData.map((row) => <div key={row.label} className="grid grid-cols-[0.75fr_1.25fr] gap-4 border-b border-border py-3 text-xs last:border-0"><dt className="text-muted-foreground">{row.label}</dt><dd className="font-medium">{row.value}</dd></div>)}</dl>
      <div className="mt-6 grid gap-6 sm:grid-cols-2"><div><h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]"><Ruler className="size-4 text-primary" />Свойства</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{item.properties.map((value) => <li key={value} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{value}</li>)}</ul></div><div><h4 className="text-xs font-semibold uppercase tracking-[0.12em]">Применение</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{item.applications.map((value) => <li key={value} className="border-b border-border pb-2 last:border-0">{value}</li>)}</ul></div></div>
      <div className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2"><div><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Преимущества</h4><ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">{item.advantages.map((value) => <li key={value}>+ {value}</li>)}</ul></div><div><h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700"><AlertTriangle className="size-3.5" />Ограничения</h4><ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">{item.limitations.map((value) => <li key={value}>— {value}</li>)}</ul></div></div>
    </article>
  )
}

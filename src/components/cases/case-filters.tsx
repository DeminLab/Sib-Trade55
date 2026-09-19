import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"

interface CaseFilterOption {
  name: string
  slug: string
  count: number
}

export function CaseFilters({ options, activeCategory }: { options: CaseFilterOption[]; activeCategory?: string }) {
  return (
    <div className="border-y border-border py-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <SlidersHorizontal className="size-4 shrink-0 text-primary" />
        <Link href="/cases" className={`shrink-0 text-sm font-semibold ${!activeCategory ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Все проекты</Link>
        {options.map((option) => (
          <Link key={option.slug} href={`/cases?category=${option.slug}`} className={`shrink-0 border-l border-border pl-3 text-sm ${activeCategory === option.slug ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {option.name} <span className="font-mono text-xs text-muted-foreground">{String(option.count).padStart(2, "0")}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

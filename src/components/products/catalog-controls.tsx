import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import type { Category } from "@/types"
import type { CatalogQuery } from "@/lib/catalog-query"
import { Button } from "@/components/ui/button"

export function CatalogControls({ query, categories, action = "/shop", categoryName }: {
  query: CatalogQuery
  categories: Category[]
  action?: string
  categoryName?: string
}) {
  const active = Boolean(query.stock || query.category)
  const input = "min-h-11 w-full rounded-sm border border-input bg-background px-3 text-base"
  return (
    <form action={action} method="get" className="mt-6 space-y-3" key={JSON.stringify(query)} role="search" aria-label="Поиск и фильтры каталога">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
          <input className={`${input} pl-10`} type="search" name="q" defaultValue={query.q} aria-label="Название товара" placeholder="Название или артикул…" />
        </div>
        <Button type="submit" className="min-h-11">Найти</Button>
      </div>
      <details className="rounded-sm border border-border bg-surface-subtle" open={active || undefined}>
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
          <SlidersHorizontal className="size-4" aria-hidden="true" />Категории и фильтры{active ? " · применены" : ""}
        </summary>
        <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2 text-sm"><span>{categoryName ? "Раздел" : "Категория"}</span>
            <select name="category" defaultValue={query.category ?? ""} className={input}>
              <option value="">{categoryName ? `Все: ${categoryName}` : "Все категории"}</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm"><span>Сортировка</span><select name="sort" defaultValue={query.sort ?? "newest"} className={input}>
            <option value="newest">Сначала новые</option><option value="name">По названию: А–Я</option>
          </select></label>
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="stock" value="1" defaultChecked={query.stock === "1"} className="size-5 accent-primary" />Только в наличии</label>
          <div className="flex items-center gap-4"><Button type="submit" className="min-h-11">Применить</Button><Link href={action} className="py-3 text-sm underline underline-offset-4">Сбросить</Link></div>
        </div>
      </details>
      {(query.q || active) ? <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>Выбранные условия: {[query.q && `«${query.q}»`, query.category && (categories.find((c) => c.slug === query.category)?.name ?? query.category), query.stock === "1" && "В наличии"].filter(Boolean).join(" · ")}</span><Link href={action} className="py-2 text-foreground underline underline-offset-4">Очистить</Link></div> : null}
    </form>
  )
}

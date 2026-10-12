"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

interface SearchResults {
  products: { id: string; name: string; sku: string; status: "active" | "draft" }[]
  categories: { id: string; name: string; path: string }[]
}

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ products: [], categories: [] })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const value = query.trim()
    if (value.length < 2) {
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(value)}`, { cache: "no-store", signal: controller.signal })
        if (!response.ok) throw new Error("Не удалось выполнить поиск")
        setResults(await response.json() as SearchResults)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults({ products: [], categories: [] })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])

  const hasResults = results.products.length + results.categories.length > 0

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <Search aria-hidden="true" className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-label="Поиск по товарам и каталогам"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-expanded={open && query.trim().length >= 2}
        aria-controls="admin-global-search-results"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setResults({ products: [], categories: [] }); setLoading(event.target.value.trim().length >= 2); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false) }}
        placeholder="Найти товар или каталог…"
        className="pl-9"
      />
      {open && query.trim().length >= 2 && <div id="admin-global-search-results" role="listbox" className="absolute inset-x-0 top-full z-40 mt-1 max-h-[min(70vh,520px)] overflow-y-auto border border-border bg-background shadow-lg">
        {loading && <p role="option" aria-selected="false" aria-disabled="true" className="px-4 py-3 text-sm text-muted-foreground">Ищем…</p>}
        {!loading && !hasResults && <p role="option" aria-selected="false" aria-disabled="true" className="px-4 py-3 text-sm text-muted-foreground">Ничего не найдено.</p>}
        {results.products.length > 0 && <div role="presentation" className="border-b border-border py-2"><p role="presentation" className="px-4 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Товары</p>{results.products.map((product) => <Link key={product.id} role="option" aria-selected="false" href={`/admin/products?productId=${encodeURIComponent(product.id)}`} onClick={() => setOpen(false)} className="block px-4 py-2.5 hover:bg-surface-subtle"><span className="block truncate text-sm font-medium">{product.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{product.sku || "Без артикула"} · {product.status === "active" ? "Опубликован" : "Черновик"}</span></Link>)}</div>}
        {results.categories.length > 0 && <div role="presentation" className="py-2"><p role="presentation" className="px-4 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Каталоги и категории</p>{results.categories.map((category) => <Link key={category.id} role="option" aria-selected="false" href={`/admin/categories?q=${encodeURIComponent(category.name)}`} onClick={() => setOpen(false)} className="block px-4 py-2.5 hover:bg-surface-subtle"><span className="block truncate text-sm font-medium">{category.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{category.path}</span></Link>)}</div>}
      </div>}
    </div>
  )
}

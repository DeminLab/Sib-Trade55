"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Archive, Check, ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, Undo2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"
import type { Category, Product, ProductImage, ProductStatus } from "@/types"

interface ProductListItem {
  id: string
  name: string
  slug: string
  status: ProductStatus
  sku: string
  price: number
  priceOnRequest: boolean
  variantCount: number
  stockTracked: boolean
  stockQuantity: number
  image: ProductImage | null
  categories: string[]
}

interface ProductPage {
  items: ProductListItem[]
  pagination: { page: number; total: number; totalPages: number }
  facets: { categories: Category[]; brands: { id: string; name: string }[] }
}

interface ArchiveUndoItem {
  id: string
  status: ProductStatus
  expiresAt?: number
}

interface ProductDraft {
  id?: string
  name: string
  slug: string
  description: string
  body: string
  status: ProductStatus
  brandId: string
  categoryIds: string[]
  tags: string
  featured: boolean
  variants: ProductVariantDraft[]
  images: ProductImage[]
}

interface ProductVariantDraft {
  id?: string
  name: string
  sku: string
  price: string
  priceOnRequest: boolean
  quantity: string
  trackInventory: boolean
  allowBackorder: boolean
  optionsText: string
  images: ProductImage[]
}

const blankVariant = (index: number): ProductVariantDraft => ({
  name: index === 0 ? "Стандартная" : `Вариант ${index + 1}`,
  sku: "",
  price: "",
  priceOnRequest: true,
  quantity: "0",
  trackInventory: false,
  allowBackorder: true,
  optionsText: "",
  images: [],
})

const blankDraft = (categoryId = "", brandId = ""): ProductDraft => ({
  name: "",
  slug: "",
  description: "",
  body: "",
  status: "draft",
  brandId,
  categoryIds: categoryId ? [categoryId] : [],
  tags: "",
  featured: false,
  variants: [blankVariant(0)],
  images: [],
})

function draftFromProduct(product: Product): ProductDraft {
  const variants = product.variants.length ? product.variants : [{
    id: undefined,
    name: "Стандартная",
    sku: "",
    price: 0,
    priceOnRequest: true,
    inventory: { quantity: 0, trackInventory: false, allowBackorder: true },
    options: [],
    images: product.images,
  }]
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    body: product.body ?? "",
    status: product.status,
    brandId: product.brandId,
    categoryIds: product.categoryIds,
    tags: product.tags.join(", "),
    featured: product.featured,
    variants: variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price ? String(variant.price) : "",
      priceOnRequest: variant.priceOnRequest ?? false,
      quantity: String(variant.inventory.quantity ?? 0),
      trackInventory: variant.inventory.trackInventory,
      allowBackorder: variant.inventory.allowBackorder,
      optionsText: variant.options.map((option) => `${option.name}: ${option.value}`).join("\n"),
      images: variant.images ?? product.images ?? [],
    })),
    images: product.images ?? [],
  }
}

function slugifyRussian(value: string) {
  const letters: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  }
  return value.toLowerCase().replace(/[а-яё]/g, (letter) => letters[letter] ?? "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function responseError(response: Response) {
  const data = await response.json().catch(() => null) as { message?: string } | null
  return data?.message ?? "Не удалось выполнить запрос"
}

export function AdminProductsManager({ initialFilters = {} }: { initialFilters?: { categoryId?: string; productId?: string; q?: string; status?: string; brandId?: string; sort?: string; availability?: string; pricing?: string; archive?: string; page?: string } }) {
  const [pageData, setPageData] = useState<ProductPage | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState(initialFilters.q ?? "")
  const [searchInput, setSearchInput] = useState(initialFilters.q ?? "")
  const [page, setPage] = useState(Math.max(1, Number(initialFilters.page) || 1))
  const [archiveView, setArchiveView] = useState(initialFilters.archive === "true")
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId ?? "")
  const [status, setStatus] = useState(initialFilters.status ?? "all")
  const [brandId, setBrandId] = useState(initialFilters.brandId ?? "all")
  const [sort, setSort] = useState(initialFilters.sort ?? "updated")
  const [availability, setAvailability] = useState(initialFilters.availability ?? "all")
  const [pricing, setPricing] = useState(initialFilters.pricing ?? "all")
  const [draft, setDraft] = useState<ProductDraft | null>(null)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [categorySearch, setCategorySearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [undoArchive, setUndoArchive] = useState<Map<string, ArchiveUndoItem>>(new Map())
  const [undoNow, setUndoNow] = useState(() => Date.now())
  const undoTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const skipPageLoadRef = useRef(false)

  useEffect(() => () => {
    for (const timer of undoTimers.current.values()) clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!undoArchive.size) return
    const interval = setInterval(() => setUndoNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [undoArchive.size])

  const offerArchiveUndo = useCallback((items: ArchiveUndoItem[]) => {
    if (!items.length) return
    const expiresAt = Date.now() + 10_000
    const expiringItems = items.map((item) => ({ ...item, expiresAt }))
    setUndoNow(Date.now())
    setUndoArchive((current) => new Map([...current, ...expiringItems.map((item) => [item.id, item] as const)]))
    for (const item of expiringItems) {
      const previous = undoTimers.current.get(item.id)
      if (previous) clearTimeout(previous)
      undoTimers.current.set(item.id, setTimeout(() => {
        undoTimers.current.delete(item.id)
        setUndoArchive((current) => {
          if (current.get(item.id)?.expiresAt !== expiresAt) return current
          const next = new Map(current)
          next.delete(item.id)
          return next
        })
      }, 10_000))
    }
  }, [])

  async function undoArchiveProduct(id: string) {
    const item = undoArchive.get(id)
    if (!item) return
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], status: item.status }),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const timer = undoTimers.current.get(id)
      if (timer) clearTimeout(timer)
      undoTimers.current.delete(id)
      setUndoArchive((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
      setPageData((current) => current ? {
        ...current,
        items: current.items.map((row) => row.id === id ? { ...row, status: item.status } : row),
      } : current)
      setNotice("Товар возвращён из архива")
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : "Не удалось вернуть товары из архива")
    } finally {
      setBusy(false)
    }
  }

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25", q: query, archive: String(archiveView), categoryId, status, brandId, sort, availability, pricing })
      const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" })
      if (!response.ok) throw new Error(await responseError(response))
      setPageData(await response.json() as ProductPage)
      setSelectedIds([])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить каталог")
    } finally {
      setLoading(false)
    }
  }, [page, query, archiveView, categoryId, status, brandId, sort, availability, pricing])

  const loadMore = useCallback(async () => {
    if (!pageData || loading || loadingMore || page >= pageData.pagination.totalPages) return
    const nextPage = page + 1
    setLoadingMore(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: "25", q: query, archive: String(archiveView), categoryId, status, brandId, sort, availability, pricing })
      const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" })
      if (!response.ok) throw new Error(await responseError(response))
      const nextData = await response.json() as ProductPage
      setPageData((current) => {
        if (!current) return nextData
        const loadedIds = new Set(current.items.map((item) => item.id))
        return { ...nextData, items: [...current.items, ...nextData.items.filter((item) => !loadedIds.has(item.id))] }
      })
      skipPageLoadRef.current = true
      setPage(nextPage)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить следующие товары")
    } finally {
      setLoadingMore(false)
    }
  }, [pageData, loading, loadingMore, page, query, archiveView, categoryId, status, brandId, sort, availability, pricing])

  useEffect(() => {
    if (skipPageLoadRef.current) {
      skipPageLoadRef.current = false
      return
    }
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (categoryId) params.set("categoryId", categoryId)
    if (status !== "all") params.set("status", status)
    if (brandId !== "all") params.set("brandId", brandId)
    if (sort !== "updated") params.set("sort", sort)
    if (availability !== "all") params.set("availability", availability)
    if (pricing !== "all") params.set("pricing", pricing)
    if (archiveView) params.set("archive", "true")
    if (page > 1) params.set("page", String(page))
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`)
  }, [query, categoryId, status, brandId, sort, availability, pricing, archiveView, page])

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response))
        const result = await response.json() as { items: Category[] }
        setCategories(result.items)
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить категории"))
  }, [])

  const categoryOptions = useMemo(() => {
    const source = pageData?.facets.categories ?? categories
    const byId = new Map(source.map((category) => [category.id, category]))
    const depthOf = (category: Category) => {
      let depth = 0
      let parent = category.parentId ? byId.get(category.parentId) : undefined
      while (parent && depth < 5) {
        depth += 1
        parent = parent.parentId ? byId.get(parent.parentId) : undefined
      }
      return depth
    }
    return source.filter((category) => category.parentId).map((category) => ({
      category,
      label: `${"— ".repeat(Math.max(0, depthOf(category) - 1))}${category.name}`,
    }))
  }, [categories, pageData?.facets.categories])
  const selectedCategoryName = pageData?.facets.categories.find((category) => category.id === categoryId)?.name
  const isProductEditPage = Boolean(initialFilters.productId)
  const listHref = useMemo(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (categoryId) params.set("categoryId", categoryId)
    if (status !== "all") params.set("status", status)
    if (brandId !== "all") params.set("brandId", brandId)
    if (sort !== "updated") params.set("sort", sort)
    if (availability !== "all") params.set("availability", availability)
    if (pricing !== "all") params.set("pricing", pricing)
    if (archiveView) params.set("archive", "true")
    if (page > 1) params.set("page", String(page))
    return `/admin/products${params.size ? `?${params}` : ""}`
  }, [query, categoryId, status, brandId, sort, availability, pricing, archiveView, page])

  function startCreate() {
    setNotice("")
    setError("")
    setNewFiles([])
    setCategorySearch("")
    setDraft(blankDraft(categoryId || categoryOptions[0]?.category.id, pageData?.facets.brands[0]?.id))
  }

  const startEdit = useCallback((id: string) => fetch(`/api/admin/products/${encodeURIComponent(id)}`, { cache: "no-store" }).then(async response => {
    if (!response.ok) throw new Error(await responseError(response))
    const result = await response.json() as { item: Product }
    setNotice(""); setError(""); setDraft(draftFromProduct(result.item)); setNewFiles([]); setCategorySearch("")
  }).catch(loadError => setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карточку")).finally(() => setBusy(false)), [])

  useEffect(() => {
    if (initialFilters.productId) void startEdit(initialFilters.productId)
  }, [initialFilters.productId, startEdit])

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const form = new FormData()
      form.set("payload", JSON.stringify({
        name: draft.name,
        slug: draft.slug,
        description: draft.description,
        body: draft.body,
        status: draft.status,
        brandId: draft.brandId,
        categoryIds: draft.categoryIds,
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        featured: draft.featured,
        price: Number(draft.variants[0]?.price) || 0,
        priceOnRequest: draft.variants[0]?.priceOnRequest ?? true,
        sku: draft.variants[0]?.sku ?? "",
        variants: draft.variants.map((variant, index) => ({
          id: variant.id || undefined,
          name: variant.name,
          sku: variant.sku,
          price: Number(variant.price) || 0,
          priceOnRequest: variant.priceOnRequest,
          currency: "RUB",
          inventory: {
            quantity: Math.max(0, Number(variant.quantity) || 0),
            trackInventory: variant.trackInventory,
            allowBackorder: variant.allowBackorder,
          },
          options: variant.optionsText.split("\n").map((line) => {
            const separator = line.indexOf(":")
            return separator < 0 ? null : { name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() }
          }).filter((option): option is { name: string; value: string } => Boolean(option?.name && option.value)),
          images: index === 0 ? draft.images : variant.images,
        })),
        images: draft.images,
      }))
      newFiles.forEach((file) => form.append("images", file))
      const response = await fetch(draft.id ? `/api/admin/products/${encodeURIComponent(draft.id)}` : "/api/admin/products", {
        method: draft.id ? "PUT" : "POST",
        body: form,
      })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as { item: Product }
      setDraft(draftFromProduct(result.item))
      setNewFiles([])
      setNotice("Карточка товара сохранена")
      await loadPage()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить карточку")
    } finally {
      setBusy(false)
    }
  }

  async function deleteProduct(id: string) {
    if (archiveView && !window.confirm("Удалить товар безвозвратно? Восстановить его будет нельзя.")) return
    const previousStatus = pageData?.items.find((item) => item.id === id)?.status
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = archiveView
        ? await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" })
        : await fetch("/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [id], status: "archived" }),
          })
      if (!response.ok) throw new Error(await responseError(response))
      setDraft(null)
      setNotice(archiveView ? "Товар удалён навсегда. Обновите список, чтобы убрать карточку." : "Товар перенесён в архив. Обновите список, чтобы убрать карточку.")
      if (archiveView) {
        const timer = undoTimers.current.get(id)
        if (timer) clearTimeout(timer)
        undoTimers.current.delete(id)
        setUndoArchive((current) => { const next = new Map(current); next.delete(id); return next })
      } else {
        setPageData((current) => current ? { ...current, items: current.items.map((item) => item.id === id ? { ...item, status: "archived" } : item) } : current)
        offerArchiveUndo([{ id, status: previousStatus ?? "active" }])
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить товар")
    } finally {
      setBusy(false)
    }
  }

  async function restoreProduct(id: string) {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { cache: "no-store" })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as { item: Product }
      const form = new FormData()
      form.set("payload", JSON.stringify({
        name: result.item.name, slug: result.item.slug, description: result.item.description, body: result.item.body ?? "",
        status: "draft", categoryIds: result.item.categoryIds, tags: result.item.tags, featured: result.item.featured,
        price: result.item.variants[0]?.price ?? 0, priceOnRequest: result.item.variants[0]?.priceOnRequest ?? false,
        sku: result.item.variants[0]?.sku ?? "", images: result.item.images,
      }))
      const update = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "PUT", body: form })
      if (!update.ok) throw new Error(await responseError(update))
      const timer = undoTimers.current.get(id)
      if (timer) clearTimeout(timer)
      undoTimers.current.delete(id)
      setUndoArchive((current) => { const next = new Map(current); next.delete(id); return next })
      setNotice("Товар восстановлен как черновик. Опубликуйте его, чтобы вернуть на витрину.")
      await loadPage()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Не удалось восстановить товар")
    } finally {
      setBusy(false)
    }
  }

  async function bulkChangeStatus(nextStatus: ProductStatus) {
    const archivedItems = nextStatus === "archived"
      ? (pageData?.items ?? []).filter((item) => selectedIds.includes(item.id)).map(({ id, status }) => ({ id, status }))
      : []
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: nextStatus }),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as { updatedCount: number }
      setNotice(`Обновлено товаров: ${result.updatedCount}`)
      setSelectedIds([])
      if (nextStatus === "archived") {
        setPageData((current) => current ? { ...current, items: current.items.map((item) => selectedIds.includes(item.id) ? { ...item, status: "archived" } : item) } : current)
        offerArchiveUndo(archivedItems)
      } else await loadPage()
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Не удалось обновить товары")
    } finally {
      setBusy(false)
    }
  }

  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  function updateVariant(index: number, changes: Partial<ProductVariantDraft>) {
    setDraft((current) => current ? {
      ...current,
      variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, ...changes } : variant),
    } : current)
  }

  return (
    <div className="space-y-7">
      {isProductEditPage ? (
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Каталог / товар</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Редактирование товара</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Измените карточку, варианты, фотографии и наличие.</p>
          </div>
          <Button asChild variant="outline"><Link href={listHref}><ChevronLeft />К списку товаров</Link></Button>
        </header>
      ) : (
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Каталог / управление</p>
            {selectedCategoryName && <Link href="/admin/categories" className="mt-2 inline-flex min-h-8 items-center text-sm font-medium text-primary hover:underline">← Все каталоги</Link>}
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{archiveView ? "Архив товаров" : selectedCategoryName ?? "Товары"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{selectedCategoryName ? `Товары в каталоге «${selectedCategoryName}» и его вложенных разделах.` : "Ищите и редактируйте товары, цены, остатки и изображения."}</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setArchiveView((current) => !current); setStatus("all"); setPage(1); setDraft(null); setNotice("") }}><Archive />{archiveView ? "К товарам" : "Архив"}</Button>{!archiveView && <Button onClick={startCreate}><Plus />Добавить товар</Button>}</div>
        </header>
      )}

      {notice && <div role="status" aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"><span>{notice}</span>{notice.includes("Обновите список") && <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>Обновить список</Button>}</div>}
      {error && <p role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      {!isProductEditPage && <section className="border border-border bg-background">
        <form onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(searchInput.trim()) }} className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 2xl:grid-cols-[minmax(220px,1fr)_repeat(6,minmax(130px,180px))_auto_auto]">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Название, артикул или адрес карточки" className="pl-9" /></div>
          <select aria-label="Каталог или категория" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }} className="h-10 min-w-0 border border-input bg-background px-3 text-sm"><option value="">Все каталоги и категории</option>{categoryOptions.map(({ category, label }) => <option key={category.id} value={category.id}>{label}</option>)}</select>
          <select aria-label="Статус товара" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-10 border border-input bg-background px-3 text-sm"><option value="all">Любой статус</option><option value="active">Опубликован</option><option value="draft">Черновик</option></select>
          <select aria-label="Бренд товара" value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1) }} className="h-10 border border-input bg-background px-3 text-sm"><option value="all">Все бренды</option>{(pageData?.facets.brands ?? []).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
          <select aria-label="Наличие товара" value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1) }} className="h-10 border border-input bg-background px-3 text-sm"><option value="all">Любой остаток</option><option value="tracked">Со складским учётом</option><option value="out">Нет в наличии</option></select>
          <select aria-label="Тип цены товара" value={pricing} onChange={(event) => { setPricing(event.target.value); setPage(1) }} className="h-10 border border-input bg-background px-3 text-sm"><option value="all">Любая цена</option><option value="priced">Указана цена</option><option value="request">Цена по запросу</option></select>
          <select aria-label="Сортировка товаров" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className="h-10 border border-input bg-background px-3 text-sm"><option value="updated">Сначала изменённые</option><option value="name">По названию</option><option value="price">Сначала дешевле</option><option value="priceDesc">Сначала дороже</option></select>
          <Button type="submit" variant="outline">Найти</Button>
          {(query || categoryId || status !== "all" || brandId !== "all" || availability !== "all" || pricing !== "all") && <Button type="button" variant="ghost" onClick={() => { setQuery(""); setSearchInput(""); setCategoryId(""); setStatus("all"); setBrandId("all"); setAvailability("all"); setPricing("all"); setPage(1) }}>Сбросить</Button>}
        </form>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground"><span>{pageData?.pagination.total ?? 0} товаров</span>{loading && <LoaderCircle className="size-4 animate-spin" />}</div>
        {selectedIds.length > 0 && <div className="flex flex-col gap-3 border-y border-border bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium">Выбрано: {selectedIds.length}</span><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void bulkChangeStatus("active")} disabled={busy}>Опубликовать</Button><Button type="button" size="sm" variant="outline" onClick={() => void bulkChangeStatus("draft")} disabled={busy}>В черновики</Button>{!archiveView && <Button type="button" size="sm" variant="outline" onClick={() => void bulkChangeStatus("archived")} disabled={busy}><Archive />В архив</Button>}</div></div>}
        {pageData?.items.length ? (
          <div className="grid gap-4 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3 2xl:grid-cols-4">
            {pageData.items.map((item) => {
              const listQuery = listHref.includes("?") ? listHref.slice(listHref.indexOf("?")) : ""
              const editHref = `/admin/products/${encodeURIComponent(item.id)}${listQuery}`
              return (
                <article key={item.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] bg-surface-subtle">
                    <Link href={editHref} prefetch={false} aria-label={`Открыть товар «${item.name}» для редактирования`} className="absolute inset-0 flex items-center justify-center p-3">
                      {item.image ? <Image src={item.image.url} alt={item.image.alt || item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-contain p-3 transition-transform duration-200 group-hover:scale-[1.03]" /> : <ImagePlus className="size-10 text-muted-foreground/60" aria-hidden="true" />}
                    </Link>
                    <input aria-label={`Выбрать ${item.name}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} className="absolute left-3 top-3 size-5 accent-primary" />
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "active" ? "bg-emerald-50 text-emerald-800" : item.status === "draft" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{item.status === "active" ? "Опубликован" : item.status === "draft" ? "Черновик" : "В архиве"}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="min-h-5 truncate text-xs text-muted-foreground">{item.categories[0] || "Без категории"}</p>
                    <Link href={editHref} prefetch={false} className="mt-1 line-clamp-2 min-h-12 text-sm font-semibold leading-6 hover:text-primary">{item.name}</Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.sku || item.slug}{item.variantCount > 1 ? ` · ${item.variantCount} вариантов` : ""}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <span className="text-lg font-bold tracking-tight">{item.priceOnRequest || item.price === 0 ? "По запросу" : formatPrice(item.price)}</span>
                      <span className="text-right text-xs text-muted-foreground">{item.stockTracked ? `${item.stockQuantity} шт.` : "Без учёта остатков"}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                      {archiveView ? <><Button asChild size="sm" variant="outline" className="flex-1"><Link href={editHref} prefetch={false}><Pencil />Открыть</Link></Button><Button size="sm" variant="outline" onClick={() => void restoreProduct(item.id)} disabled={busy}><Undo2 />Вернуть</Button><Button size="icon" variant="ghost" aria-label={`Удалить ${item.name} навсегда`} title="Удалить навсегда" onClick={() => void deleteProduct(item.id)} disabled={busy}><Trash2 className="text-destructive" /></Button></> : undoArchive.has(item.id) ? <><Button asChild size="sm" variant="outline" className="flex-1"><Link href={editHref} prefetch={false}><Pencil />Изменить</Link></Button><Button size="sm" variant="outline" onClick={() => void undoArchiveProduct(item.id)} disabled={busy}><Undo2 />Отменить · {Math.max(0, Math.ceil(((undoArchive.get(item.id)?.expiresAt ?? undoNow) - undoNow) / 1000))} с</Button></> : <><Button asChild size="sm" variant="outline" className="flex-1"><Link href={editHref} prefetch={false}><Pencil />Изменить</Link></Button><Button size="icon" variant="ghost" aria-label={`Перенести ${item.name} в архив`} title="Перенести в архив" onClick={() => void deleteProduct(item.id)} disabled={busy}><Trash2 className="text-destructive" /></Button></>}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : !loading ? <p className="px-4 py-14 text-center text-muted-foreground">По этому запросу товары не найдены.</p> : null}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}><ChevronLeft />Назад</Button>
          <span className="text-xs text-muted-foreground">Страница {page} из {Math.max(1, pageData?.pagination.totalPages ?? 1)}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= (pageData?.pagination.totalPages ?? 1)}>Дальше<ChevronRight /></Button>
        </div>
        {!loading && pageData && page < pageData.pagination.totalPages && <div className="flex justify-center border-t border-border p-4"><Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loadingMore || loading}>{loadingMore ? <LoaderCircle className="animate-spin" /> : <Plus />}{loadingMore ? "Загружаем…" : "Показать ещё 25 товаров"}</Button></div>}
      </section>}

      {isProductEditPage && !draft && <section className="flex items-center justify-center gap-3 border border-border bg-background px-4 py-16 text-sm text-muted-foreground">{busy || loading ? <><LoaderCircle className="size-5 animate-spin" />Загружаем карточку товара…</> : "Товар не найден."}</section>}

      {draft && (
        <section className="border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{draft.id ? "Редактирование" : "Новая карточка"}</p><h2 className="mt-1 text-xl font-semibold">{draft.name || "Товар"}</h2></div>{isProductEditPage ? <Button asChild size="icon" variant="ghost"><Link href={listHref} aria-label="К списку товаров"><X /></Link></Button> : <Button size="icon" variant="ghost" onClick={() => setDraft(null)} aria-label="Закрыть редактор"><X /></Button>}</div>
          <form onSubmit={(event) => void saveProduct(event)} className="grid min-w-0 gap-5 p-3.5 min-[420px]:p-5 lg:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">Название<Input required minLength={2} maxLength={240} value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((current) => current ? { ...current, name, slug: current.id || current.slug ? current.slug : slugifyRussian(name) } : current) }} /></label>
            <label className="space-y-1.5 text-sm font-medium">Адрес страницы<Input required value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} /><span className="block text-xs font-normal text-muted-foreground">Латинские буквы, цифры и дефисы</span></label>
            <label className="space-y-1.5 text-sm font-medium">Бренд<select value={draft.brandId} onChange={(event) => updateDraft("brandId", event.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm"><option value="">Не выбран</option>{(pageData?.facets.brands ?? []).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="space-y-1.5 text-sm font-medium lg:col-span-2">Краткое описание<Textarea rows={3} maxLength={5000} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
            <label className="space-y-1.5 text-sm font-medium lg:col-span-2">Полное описание<Textarea rows={6} maxLength={30000} value={draft.body} onChange={(event) => updateDraft("body", event.target.value)} placeholder="Допускается HTML-разметка" /></label>
            <fieldset className="min-w-0 space-y-2"><legend className="text-sm font-medium">Категории товара</legend><Input aria-label="Найти категорию для товара" value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Найти категорию" /><div className="max-h-52 space-y-1 overflow-y-auto border border-input p-2">{categoryOptions.filter(({ category, label }) => `${label} ${category.slug}`.toLocaleLowerCase("ru-RU").includes(categorySearch.trim().toLocaleLowerCase("ru-RU"))).map(({ category, label }) => <label key={category.id} className="flex items-start gap-2 px-2 py-1.5 text-sm hover:bg-surface-subtle"><input className="mt-1" type="checkbox" checked={draft.categoryIds.includes(category.id)} onChange={(event) => updateDraft("categoryIds", event.target.checked ? [...draft.categoryIds, category.id] : draft.categoryIds.filter((id) => id !== category.id))} /><span>{label}</span></label>)}{categoryOptions.every(({ category, label }) => !`${label} ${category.slug}`.toLocaleLowerCase("ru-RU").includes(categorySearch.trim().toLocaleLowerCase("ru-RU"))) && <p className="px-2 py-3 text-sm text-muted-foreground">Категория не найдена.</p>}</div><span className="block text-xs font-normal text-muted-foreground">Выбрано категорий: {draft.categoryIds.length}</span></fieldset>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Варианты и наличие</h3><Button type="button" size="sm" variant="outline" onClick={() => updateDraft("variants", [...draft.variants, blankVariant(draft.variants.length)])}><Plus />Добавить вариант</Button></div>
              {draft.variants.map((variant, index) => (
                <fieldset key={variant.id ?? `new-${index}`} className="space-y-4 border border-border p-4">
                  <legend className="px-2 text-sm font-semibold">Вариант {index + 1}</legend>
                  <div className="grid gap-3 min-[480px]:grid-cols-2"><label className="min-w-0 space-y-1.5 text-sm font-medium">Название варианта<Input required maxLength={180} value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} /></label><label className="min-w-0 space-y-1.5 text-sm font-medium">Артикул<Input maxLength={120} value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} /></label></div>
                  <div className="grid gap-3 min-[480px]:grid-cols-2"><label className="min-w-0 space-y-1.5 text-sm font-medium">Цена, ₽<Input type="number" min="0" step="1" value={variant.price} disabled={variant.priceOnRequest} onChange={(event) => updateVariant(index, { price: event.target.value })} /></label><label className="min-w-0 space-y-1.5 text-sm font-medium">Количество на складе<Input type="number" min="0" step="1" value={variant.quantity} disabled={!variant.trackInventory} onChange={(event) => updateVariant(index, { quantity: event.target.value })} /></label></div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={variant.priceOnRequest} onChange={(event) => updateVariant(index, { priceOnRequest: event.target.checked })} />Цена по запросу</label><label className="flex items-center gap-2"><input type="checkbox" checked={variant.trackInventory} onChange={(event) => updateVariant(index, { trackInventory: event.target.checked })} />Учитывать остаток</label><label className="flex items-center gap-2"><input type="checkbox" checked={variant.allowBackorder} onChange={(event) => updateVariant(index, { allowBackorder: event.target.checked })} />Разрешить заказ при нулевом остатке</label></div>
                  <label className="block space-y-1.5 text-sm font-medium">Характеристики варианта<Textarea rows={2} value={variant.optionsText} onChange={(event) => updateVariant(index, { optionsText: event.target.value })} placeholder="Размер: 1500 мм&#10;Покрытие: оцинкованное" /><span className="block text-xs font-normal text-muted-foreground">Каждая строка в формате «параметр: значение».</span></label>
                  {draft.variants.length > 1 && <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => updateDraft("variants", draft.variants.filter((_, itemIndex) => itemIndex !== index))}><Trash2 />Удалить вариант</Button>}
                </fieldset>
              ))}
              <div className="grid gap-3 min-[480px]:grid-cols-2"><label className="min-w-0 space-y-1.5 text-sm font-medium">Публикация<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as ProductStatus)} className="h-10 w-full border border-input bg-background px-3 text-sm"><option value="draft">Черновик</option><option value="active">Опубликован</option><option value="archived">В архиве</option></select></label><label className="min-w-0 space-y-1.5 text-sm font-medium">Метки<Input value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} placeholder="через запятую" /></label></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={(event) => updateDraft("featured", event.target.checked)} />Показывать в подборке на главной</label>
            </div>
            <div className="space-y-3 lg:col-span-2"><label className="block text-sm font-medium">Фотографии товара</label><div className="flex flex-wrap gap-3">{draft.images.map((image, index) => <div key={`${image.url}-${index}`} className="relative size-24 border border-border bg-surface-subtle"><Image src={image.url} alt={image.alt} fill sizes="96px" className="object-contain p-1" /><button type="button" onClick={() => updateDraft("images", draft.images.filter((_, itemIndex) => itemIndex !== index))} className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white" aria-label="Убрать изображение"><X className="size-3" /></button></div>)}{newFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex size-24 items-center justify-center border border-dashed border-primary/50 bg-primary/5 p-2 text-center text-xs">{file.name}</div>)}</div><Input type="file" accept="image/*" multiple onChange={(event) => setNewFiles((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 20))} /><p className="text-xs text-muted-foreground">Файлы сохраняются на сервере в WebP. До 20 файлов по 10 МБ.</p></div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4 lg:col-span-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>Закрыть</Button><Button type="submit" disabled={busy || categories.length === 0}>{busy && <LoaderCircle className="animate-spin" />}{busy ? "Сохраняем…" : <><Check />Сохранить карточку</>}</Button></div>
          </form>
        </section>
      )}
    </div>
  )
}

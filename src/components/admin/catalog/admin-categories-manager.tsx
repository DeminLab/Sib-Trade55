"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, FolderPlus, FolderTree, ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Category, ProductImage } from "@/types"

interface CategoryRow extends Category {
  productCount: number
  subtreeProductCount: number
}

interface CategoryDraft {
  id?: string
  name: string
  slug: string
  description: string
  parentId: string
  order: string
  image: ProductImage | null
  productCount: number
}

const blankDraft = (parentId = ""): CategoryDraft => ({ name: "", slug: "", description: "", parentId, order: "1000", image: null, productCount: 0 })

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

export function AdminCategoriesManager({ initialQuery = "" }: { initialQuery?: string }) {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [search, setSearch] = useState(initialQuery)
  const [draft, setDraft] = useState<CategoryDraft | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadCategories = useCallback(() => fetch("/api/admin/categories", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as { items: CategoryRow[] }
      setCategories(result.items.sort((left, right) => left.order - right.order))
      setError("")
    }).catch(loadError => {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить категории")
    }).finally(() => setLoading(false)), [])

  useEffect(() => { void loadCategories() }, [loadCategories])

  const parents = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]))
    return categories.map((category) => {
      const parts = [category.name]
      let depth = 0
      let parent = category.parentId ? byId.get(category.parentId) : undefined
      while (parent && parts.length < 5) {
        depth += 1
        parts.unshift(parent.name)
        parent = parent.parentId ? byId.get(parent.parentId) : undefined
      }
      return { ...category, depth, treeLabel: parts.join(" / ") }
    })
  }, [categories])

  const descendantsById = useMemo(() => {
    const childrenByParent = new Map<string, string[]>()
    for (const category of categories) {
      if (!category.parentId) continue
      childrenByParent.set(category.parentId, [...(childrenByParent.get(category.parentId) ?? []), category.id])
    }
    return new Map(categories.map((category) => {
      const descendants = new Set<string>([category.id])
      const queue = [category.id]
      for (let index = 0; index < queue.length; index += 1) {
        for (const childId of childrenByParent.get(queue[index]) ?? []) {
          if (descendants.has(childId)) continue
          descendants.add(childId)
          queue.push(childId)
        }
      }
      return [category.id, descendants] as const
    }))
  }, [categories])

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU")
    return parents.filter((category) => !query || `${category.name} ${category.slug} ${category.description}`.toLocaleLowerCase("ru-RU").includes(query))
  }, [parents, search])

  function startCreate(parentId = "") {
    setDraft(blankDraft(parentId))
    setNewFile(null)
    setError("")
    setNotice("")
  }

  function startEdit(category: CategoryRow) {
    setDraft({ ...category, parentId: category.parentId ?? "", image: category.image ?? null, order: String(category.order), productCount: category.productCount })
    setNewFile(null)
    setError("")
    setNotice("")
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
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
        parentId: draft.parentId,
        order: Number(draft.order) || 0,
        image: draft.image,
      }))
      if (newFile) form.append("image", newFile)
      const response = await fetch(draft.id ? `/api/admin/categories/${encodeURIComponent(draft.id)}` : "/api/admin/categories", {
        method: draft.id ? "PUT" : "POST",
        body: form,
      })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as { item: Category }
      setDraft(null)
      setNewFile(null)
      setNotice("Категория сохранена")
      await loadCategories()
      if (result.item) setNotice("Категория сохранена")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить категорию")
    } finally {
      setBusy(false)
    }
  }

  async function deleteCategory(category: CategoryRow) {
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) return
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.id)}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await responseError(response))
      if (draft?.id === category.id) setDraft(null)
      setNotice("Категория удалена")
      await loadCategories()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить категорию")
    } finally {
      setBusy(false)
    }
  }

  function updateDraft<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Каталог / структура</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Категории</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Управляйте деревом каталога: создавайте разделы и подкатегории, переносите их между разделами и редактируйте товары.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/admin/products"><FolderTree />Все товары</Link></Button>
          <Button onClick={() => startCreate()}><Plus />Добавить раздел</Button>
        </div>
      </header>

      {notice && <p role="status" className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      <section className="border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти категорию" className="pl-9" /></div><span className="text-sm text-muted-foreground">{visibleCategories.length} из {categories.length} категорий {loading && <LoaderCircle className="ml-2 inline size-4 animate-spin" />}</span></div>
        <div className="divide-y divide-border">
          {visibleCategories.map((category) => (
            <div key={category.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ paddingInlineStart: `calc(1rem + ${Math.min(category.depth, 4) * 1.25}rem)` }}>
              <div className="flex min-w-0 items-center gap-3">
                {category.image ? <Image src={category.image.url} alt={category.image.alt || category.name} width={52} height={52} className="size-13 shrink-0 border border-border bg-background object-contain" /> : <div className="flex size-13 shrink-0 items-center justify-center border border-border text-muted-foreground"><FolderTree className="size-5" /></div>}
                <div className="min-w-0"><p className="truncate font-semibold">{category.name}</p>{category.depth > 0 && <p className="mt-0.5 truncate text-xs text-muted-foreground">{category.treeLabel}</p>}<p className="mt-1 text-xs text-muted-foreground">/{category.slug} · {category.productCount} в разделе · {category.subtreeProductCount} со вложенными</p></div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => startCreate(category.id)} disabled={busy}><FolderPlus />Подкатегория</Button><Button asChild size="sm" variant="outline"><Link href={`/admin/products?categoryId=${encodeURIComponent(category.id)}`}>Товары ({category.subtreeProductCount})</Link></Button><Button size="sm" variant="outline" onClick={() => startEdit(category)} disabled={busy}><Pencil />Настроить</Button><Button size="icon" variant="ghost" aria-label={`Удалить ${category.name}`} onClick={() => void deleteCategory(category)} disabled={busy || !category.parentId}><Trash2 className="text-destructive" /></Button></div>
            </div>
          ))}
          {!loading && visibleCategories.length === 0 && <p className="px-4 py-14 text-center text-sm text-muted-foreground">Категории не найдены.</p>}
        </div>
      </section>

      {draft && (
        <section className="border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{draft.id ? "Редактирование" : "Новая категория"}</p><h2 className="mt-1 text-xl font-semibold">{draft.name || "Категория"}</h2></div><Button size="icon" variant="ghost" onClick={() => setDraft(null)} aria-label="Закрыть редактор"><X /></Button></div>
          <form onSubmit={(event) => void saveCategory(event)} className="grid gap-5 p-5 lg:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">Название<Input required minLength={2} maxLength={180} value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((current) => current ? { ...current, name, slug: current.id || current.slug ? current.slug : slugifyRussian(name) } : current) }} /></label>
            <label className="space-y-1.5 text-sm font-medium">Адрес страницы<Input required value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} /><span className="block text-xs font-normal text-muted-foreground">Латинские буквы, цифры и дефисы</span></label>
            <label className="space-y-1.5 text-sm font-medium lg:col-span-2">Описание<Textarea rows={4} maxLength={5000} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
            <label className="space-y-1.5 text-sm font-medium">Родительская категория<select value={draft.parentId} onChange={(event) => updateDraft("parentId", event.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm"><option value="">Корневой раздел</option>{parents.filter((category) => !draft.id || !descendantsById.get(draft.id)?.has(category.id)).map((category) => <option key={category.id} value={category.id}>{"　".repeat(category.depth)}{category.name}</option>)}</select><span className="block text-xs font-normal text-muted-foreground">Оставьте корневым или выберите родительский раздел.</span></label>
            <label className="space-y-1.5 text-sm font-medium">Порядок показа<Input type="number" min="0" max="100000" value={draft.order} onChange={(event) => updateDraft("order", event.target.value)} /></label>
            <div className="space-y-3 lg:col-span-2"><label className="block text-sm font-medium">Изображение категории</label>{draft.image && <div className="flex items-center gap-3"><div className="relative size-24 border border-border bg-surface-subtle"><Image src={draft.image.url} alt={draft.image.alt || draft.name} fill sizes="96px" className="object-contain p-1" /></div><Button type="button" variant="outline" onClick={() => updateDraft("image", null)}>Убрать текущее</Button></div>}<div className="flex items-center gap-3"><ImagePlus className="size-5 text-muted-foreground" /><Input type="file" accept="image/*" onChange={(event) => setNewFile(event.target.files?.[0] ?? null)} /></div><p className="text-xs text-muted-foreground">Изображение будет сохранено на сервере в WebP.</p></div>
            <div className="flex justify-end gap-3 border-t border-border pt-4 lg:col-span-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>Закрыть</Button><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Check />}{busy ? "Сохраняем…" : "Сохранить категорию"}</Button></div>
          </form>
        </section>
      )}
    </div>
  )
}

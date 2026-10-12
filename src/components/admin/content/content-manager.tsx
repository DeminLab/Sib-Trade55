"use client"
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { contentModels, newContentItem, type ContentCollection } from '@/lib/content-models'
import { FieldEditor } from './field-editor'
type Item = Record<string, unknown>
type List = { items: Item[]; revision: string }
export function ContentManager({ initial = 'pages' }: { initial?: ContentCollection }) {
  const [collection, setCollection] = useState<ContentCollection>(initial)
  const [list, setList] = useState<List | null>(null)
  const [draft, setDraft] = useState<Item | null>(null)
  const [query, setQuery] = useState('')
  const [archive, setArchive] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(true)
  const [uploads, setUploads] = useState(0)
  const model = contentModels[collection]
  const load = useCallback((signal?: AbortSignal) => fetch(`/api/admin/content/${collection}`, { cache: 'no-store', signal }).then(async res => {
    const data = await res.json(); if (!res.ok) throw new Error(data.message)
    if (!signal?.aborted) { setList(data); setError('') }
  }).catch(e => { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Ошибка загрузки') }).finally(() => { if (!signal?.aborted) setBusy(false) }), [collection])
  useEffect(() => { const ctrl = new AbortController(); void load(ctrl.signal); return () => ctrl.abort() }, [load])
  async function mutate(action: string, item?: Item) {
    if (!list || busy || uploads > 0) return
    if (action === 'archive' && !window.confirm('Переместить запись в архив? Её можно восстановить.')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const res = await fetch(`/api/admin/content/${collection}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, item, id: item?._originalCode ?? item?.id ?? item?.code, revision: list.revision }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.message)
      setList(data); setDraft(null); setNotice(action === 'save' ? 'Сохранено. Изменения доступны на сайте.' : action === 'archive' ? 'Запись в архиве' : 'Запись восстановлена')
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения') }
    finally { setBusy(false) }
  }
  const filtered = list?.items.filter(i => Boolean(i.archived) === archive && `${i.title ?? i.name} ${i.slug ?? i.code}`.toLowerCase().includes(query.toLowerCase())) ?? []
  function changeSection(next: ContentCollection) {
    if (draft && !window.confirm('Закрыть редактор без сохранения?')) return
    setBusy(true); setError(''); setCollection(next); setList(null); setDraft(null); setNotice(''); setQuery('')
  }
  return <section className="space-y-5">
    <header><p className="industrial-label">Контент сайта</p><h1 className="mt-2 text-3xl font-semibold">Редактор публикаций</h1><p className="mt-2 text-sm text-muted-foreground">Создание, редактирование и архив. HTML в тексте очищается от скриптов. Проверьте публикацию на витрине после сохранения.</p></header>
    <nav aria-label="Виды контента" className="flex flex-wrap gap-2">{Object.entries(contentModels).map(([key, m]) => <Button key={key} variant={collection === key ? 'default' : 'outline'} disabled={busy || uploads > 0} onClick={() => changeSection(key as ContentCollection)}>{m.title}</Button>)}</nav>
    {error && <p role="alert" className="border border-destructive p-4 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="border border-border bg-background p-4 text-sm">{notice}</p>}
    {draft ? <form className="space-y-5 border border-border bg-background p-4 sm:p-6" onSubmit={e => { e.preventDefault(); void mutate('save', draft) }}>
      <h2 className="text-xl font-semibold">{model.title} · редактирование</h2>
      {collection === 'pages' && <p className="text-sm text-muted-foreground">Для изменения основных страниц используйте адреса: home, about, how-we-work, faq, policies-shipping, policies-returns, policies-privacy, policies-terms. Архивирование вернёт исходную страницу.</p>}
      <fieldset disabled={busy || uploads > 0} className="space-y-5">{model.fields.map(field => <FieldEditor onUpload={delta => setUploads(n => n + delta)} key={field} name={field} value={draft[field] ?? (field === 'coverImage' ? { url: '', alt: '' } : '')} onChange={v => setDraft(current => current ? { ...current, [field]: v } : null)} />)}</fieldset>
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border bg-background py-4"><Button disabled={busy || uploads > 0} type="submit">{busy ? 'Сохраняем…' : 'Сохранить'}</Button><Button disabled={busy || uploads > 0} type="button" variant="outline" onClick={() => { if (window.confirm('Закрыть без сохранения?')) setDraft(null) }}>Отмена</Button></div>
    </form> : <>
      <div className="flex flex-wrap items-center gap-3"><label className="min-w-0 flex-1"><span className="sr-only">Поиск публикаций</span><input className="min-h-11 w-full border border-input bg-background px-3" placeholder="Название или адрес…" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archive} onChange={e => setArchive(e.target.checked)} />Архив</label><Button variant="outline" disabled={busy || uploads > 0} onClick={() => { setBusy(true); void load() }}>Обновить</Button><Button disabled={busy || uploads > 0} onClick={() => setDraft(newContentItem(collection))}>Создать</Button></div>
      {busy && <p role="status">Загружаем…</p>}
      {!busy && !error && filtered.length === 0 && <p role="status" className="border border-border p-6 text-sm">Записей по этим условиям нет.</p>}
      <div className="divide-y border border-border bg-background">{filtered.map(i => <article key={String(i.id ?? i.code)} className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="break-words font-medium">{String(i.title ?? i.name)}</h2><p className="break-all text-sm text-muted-foreground">{String(i.slug ?? i.code)} · {i.archived ? 'Архив' : 'Опубликовано'}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Button variant="outline" disabled={busy || uploads > 0} onClick={() => setDraft({ ...newContentItem(collection), ...structuredClone(i), _originalCode: i.code })}>Редактировать</Button><Button variant="outline" disabled={busy || uploads > 0} onClick={() => void mutate(archive ? 'restore' : 'archive', i)}>{archive ? 'Восстановить' : 'В архив'}</Button></div></article>)}</div>
    </>}
  </section>
}




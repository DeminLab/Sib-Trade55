"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/services/api-client"
import type { RequestKind, RequestRecord, RequestStatus } from "@/lib/requests/types"
import { RequestDetails } from "./request-details"

const titles = { contact: "Обращения", quote: "Запросы КП", custom: "Заявки на подбор и поставку" }
const statuses: Record<RequestStatus, string> = { submitted: "Новая", processing: "В работе", completed: "Завершена", cancelled: "Отменена" }
const notificationLabels = { not_configured: "Telegram не подключён", pending: "Ожидает отправки в Telegram", sent: "Уведомление отправлено", failed: "Ошибка отправки в Telegram" }
interface RequestList { items: RequestRecord[]; total: number; page: number; totalPages: number }

export function AdminRequestsManager({ kind }: { kind: RequestKind }) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [list, setList] = useState<RequestList | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")
  const [loading, setLoading] = useState(true)
  const load = useCallback((signal?: AbortSignal) => apiRequest<RequestList>(`/api/admin/requests?kind=${kind}&page=${page}&${new URLSearchParams(filters)}`, { signal, cache: "no-store" }).then(data => {
    if (!signal?.aborted) { setList(data); setError("") }
  }).catch(error => { if (!signal?.aborted) setError(error instanceof Error ? error.message : "Не удалось загрузить заявки") }).finally(() => { if (!signal?.aborted) setLoading(false) }), [kind, page, filters])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function update(id: string, body: { status: RequestStatus } | { action: "retry_notification" }) {
    setSaving(id)
    setError("")
    try {
      const updated = await apiRequest<RequestRecord>(`/api/admin/requests/${id}`, { method: "PATCH", body: JSON.stringify(body) })
      setList((current) => current ? { ...current, items: current.items.map((item) => item.id === id ? updated : item) } : current)
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось обновить заявку") }
    finally { setSaving("") }
  }

  return <section>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight">{titles[kind]}</h1><p className="mt-3 text-sm text-muted-foreground">Контакты, детали и состояние заявок.{list && ` Всего: ${list.total}.`}</p></div><Button variant="outline" disabled={loading || Boolean(saving)} onClick={() => { setLoading(true); void load() }}>Обновить список</Button></div>
    {error && <p role="alert" className="mt-5 border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
    <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={e => { e.preventDefault(); setLoading(true); const values = new FormData(e.currentTarget); setPage(1); setFilters({ q: String(values.get('q') ?? ''), status: String(values.get('status') ?? '') }) }}><label className="min-w-0 flex-1"><span className="sr-only">Поиск заявок</span><input name="q" maxLength={120} className="min-h-11 w-full border border-input bg-background px-3" placeholder="Номер, имя, телефон, email или задача…" /></label><label><span className="sr-only">Фильтр статуса</span><select name="status" className="min-h-11 w-full border border-input bg-background px-3"><option value="">Все статусы</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button disabled={loading} type="submit">Найти</Button></form>
    {loading && <p role="status" className="mt-5 text-sm text-muted-foreground">Загружаем заявки…</p>}
    {!loading && list?.items.length === 0 && <p className="mt-8 border border-border bg-background p-8 text-sm text-muted-foreground">Пока заявок нет. Новые обращения с сайта появятся здесь.</p>}
    <div className="mt-6 space-y-4" aria-busy={loading}>{list?.items.map((record) => <article key={record.id} className="min-w-0 border border-border bg-background p-4 sm:p-6">
      <details>
        <summary className="cursor-pointer break-words text-base font-semibold focus-visible:outline-2">{record.requestNumber} · {record.kind === "quote" ? record.data.contactName : record.data.name}</summary>
        <RequestDetails record={record} />
      </details>
      <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6"><span>{new Date(record.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Omsk" })}</span><span className="break-all">{record.data.email}</span><span>{record.data.phone || "Телефон не указан"}</span></div>
      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm">Статус<select aria-label={`Статус ${record.requestNumber}`} className="min-h-10 min-w-0 border border-input bg-background px-3 focus-visible:outline-2" value={record.status} disabled={Boolean(saving) || loading} onChange={(event) => void update(record.id, { status: event.target.value as RequestStatus })}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground"><span role="status">{notificationLabels[record.notificationStatus]}</span>{record.notificationStatus !== "sent" && <Button size="sm" variant="outline" disabled={Boolean(saving) || loading} onClick={() => void update(record.id, { action: "retry_notification" })}>{saving === record.id ? "Сохраняем…" : "Отправить в Telegram"}</Button>}</div>
      </div>
    </article>)}</div>
    {list && list.totalPages > 1 && <nav aria-label="Страницы заявок" className="mt-6 flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1 || loading || Boolean(saving)} onClick={() => { setLoading(true); setPage((value) => value - 1) }}>Назад</Button><span className="text-sm">{page} / {list.totalPages}</span><Button variant="outline" disabled={page >= list.totalPages || loading || Boolean(saving)} onClick={() => { setLoading(true); setPage((value) => value + 1) }}>Далее</Button></nav>}
  </section>
}

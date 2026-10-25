"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Visitor = {
  visitorId: string
  email: string | null
  firstSeen: string
  lastSeen: string
  visits: number
  pageViews: number
  page: string
  source: string
  device: string
  browser: string
  platform: string
}
type Report = { pageViews: number; visitorCount: number; visitors: Visitor[] }

async function fetchVisitReport(signal?: AbortSignal): Promise<Report> {
  const response = await fetch("/api/admin/visitors", { cache: "no-store", signal })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message ?? "Не удалось загрузить журнал посещений")
  return data
}

const dateTime = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Omsk", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value))

export function VisitorAnalytics() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setReport(await fetchVisitReport())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить журнал посещений")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchVisitReport(controller.signal).then(setReport).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Не удалось загрузить журнал посещений")
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return (
    <section className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">СИБ-ТРЕЙД / аналитика</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Посещения</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Посетители, повторные визиты, страницы, устройства и источник перехода.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? "Обновляем…" : "Обновить"}</Button>
      </header>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
        <article className="bg-background p-5 sm:p-6"><p className="text-sm text-muted-foreground">Посетители</p><p className="mt-4 text-3xl font-semibold tabular-nums">{report?.visitorCount ?? "—"}</p></article>
        <article className="bg-background p-5 sm:p-6"><p className="text-sm text-muted-foreground">Просмотры страниц</p><p className="mt-4 text-3xl font-semibold tabular-nums">{report?.pageViews ?? "—"}</p></article>
      </div>

      <div className="border border-border bg-background">
        <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Недавние посетители</h2><p className="mt-1 text-sm text-muted-foreground">До 200 браузеров; визит считается после 30 минут бездействия.</p></div>
        {error && <p role="alert" className="m-5 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        {loading && !report ? <p role="status" className="p-6 text-sm text-muted-foreground">Загружаем журнал…</p> : null}
        {!loading && report?.visitors.length === 0 && <p role="status" className="p-8 text-center text-sm text-muted-foreground">Посещений пока нет. Данные появятся после просмотра сайта.</p>}
        {report && report.visitors.length > 0 && <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="px-4 py-3">Кто</th><th className="px-4 py-3">Визиты / страницы</th><th className="px-4 py-3">Устройство</th><th className="px-4 py-3">Источник</th><th className="px-4 py-3">Последняя страница</th><th className="px-4 py-3">Первый / последний визит</th></tr></thead>
            <tbody>{report.visitors.map(visitor => <tr key={visitor.visitorId} className="border-b border-border align-top last:border-0 hover:bg-surface-subtle">
              <td className="max-w-56 px-4 py-4"><p className="break-all font-medium">{visitor.email ?? "Анонимный посетитель"}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{visitor.visitorId.slice(0, 8)}</p></td>
              <td className="px-4 py-4 tabular-nums">{visitor.visits} / {visitor.pageViews}</td>
              <td className="px-4 py-4"><p>{visitor.device}</p><p className="mt-1 text-xs text-muted-foreground">{visitor.browser} · {visitor.platform}</p></td>
              <td className="max-w-52 break-all px-4 py-4 text-muted-foreground">{visitor.source}</td>
              <td className="max-w-48 break-all px-4 py-4"><a className="text-primary underline-offset-4 hover:underline" href={visitor.page}>{visitor.page}</a></td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground"><p>{dateTime(visitor.firstSeen)}</p><p className="mt-1">{dateTime(visitor.lastSeen)}</p></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">Для анонимных посетителей отображается случайный идентификатор браузера; email показывается только если человек авторизован. IP-адреса и точная геолокация не сохраняются. Источник определяется по рефереру и может быть скрыт настройками браузера.</p>
    </section>
  )
}

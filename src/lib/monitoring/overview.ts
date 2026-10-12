import { cpus, freemem, totalmem, uptime } from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { inspectSqliteStore, readSqliteOrders, readRequestStatistics } from '@/lib/database/sqlite-store'
import { readCatalog } from '@/lib/catalog/catalog-store'
import { errorCounts } from './errors'
import packageInfo from '../../../package.json'

const state = globalThis as typeof globalThis & { sibTradeHealth?: { expires: number; value: Awaited<ReturnType<typeof sampleHealth>> }; sibTradeCpu?: { at: number; usage: NodeJS.CpuUsage; host: { idle: number; total: number } } }
function cgroupNumber(file: string) { try { const v = readFileSync(file, 'utf8').trim(); return v === 'max' ? null : Number(v) } catch { return null } }
async function sampleHealth() {
  const db = await inspectSqliteStore()
  const now = Date.now(); const usage = process.cpuUsage()
  const host = cpus().reduce((sum, cpu) => ({ idle: sum.idle + cpu.times.idle, total: sum.total + Object.values(cpu.times).reduce((a, b) => a + b, 0) }), { idle: 0, total: 0 })
  const previous = state.sibTradeCpu
  const processCpuPercent = previous ? Math.round(((usage.user - previous.usage.user) + (usage.system - previous.usage.system)) / ((now - previous.at) * 1000) * 1000) / 10 : null
  const hostCpuPercent = previous && host.total > previous.host.total ? Math.round((1 - (host.idle - previous.host.idle) / (host.total - previous.host.total)) * 1000) / 10 : null
  state.sibTradeCpu = { at: now, usage, host }
  const container = existsSync('/.dockerenv') || existsSync('/run/.containerenv')
  return { sampledAt: new Date().toISOString(), process: { uptimeSeconds: Math.floor(process.uptime()), cpuPercent: processCpuPercent, memory: process.memoryUsage(), errors: { ...errorCounts() }, node: process.version, next: packageInfo.dependencies.next, app: packageInfo.version, environment: process.env.NODE_ENV ?? 'unknown' },
    os: { scope: container ? 'ОС, видимая контейнеру; не лимиты контейнера' : 'Хост локального процесса', uptimeSeconds: Math.floor(uptime()), cpuPercent: hostCpuPercent, cpuCount: cpus().length, totalMemory: totalmem(), freeMemory: freemem() },
    container: { detected: container, memoryBytes: container ? cgroupNumber('/sys/fs/cgroup/memory.current') : null, memoryLimitBytes: container ? cgroupNumber('/sys/fs/cgroup/memory.max') : null, reason: container ? 'Лимиты памяти читаются из cgroup v2 при доступности. Docker API и другие контейнеры недоступны.' : 'Приложение запущено на хосте, контейнерные метрики недоступны.' },
    database: db, services: { sqlite: db.readable ? 'Доступна' : 'Ошибка чтения', telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? 'Настроен; доставка оценивается по заявкам' : 'Не настроен', postgres: 'Не используется для текущего хранилища; legacy импорт', nginx: 'Нет доступа к процессу/контейнеру Nginx из приложения' },
    analytics: 'Посещаемость и конверсия не собираются. Исторические показатели отсутствуют.' }
}
export async function healthSnapshot() {
  if (state.sibTradeHealth && state.sibTradeHealth.expires > Date.now()) return state.sibTradeHealth.value
  const value = await sampleHealth(); state.sibTradeHealth = { expires: Date.now() + 30000, value }; return value
}
const day = (date: string) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Omsk', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date))
export async function businessSnapshot(from: string, to: string) {
  const [catalog, orders, requests] = await Promise.all([readCatalog(), readSqliteOrders(), readRequestStatistics()])
  const inPeriod = (created: string) => day(created) >= from && day(created) <= to
  const selectedOrders = orders.filter(o => inPeriod(o.createdAt))
  const selectedRequests = requests.filter(r => inPeriod(String(r.created_at)))
  const counts = (rows: Record<string, unknown>[], field: string) => rows.reduce<Record<string, number>>((result, row) => { const key = String(row[field]); result[key] = (result[key] ?? 0) + 1; return result }, {})
  const trend: Record<string, { date: string; orders: number; contact: number; quote: number; custom: number }> = {}
  for (const order of selectedOrders) { const date = day(order.createdAt); (trend[date] ??= { date, orders: 0, contact: 0, quote: 0, custom: 0 }).orders++ }
  for (const request of selectedRequests) { const date = day(String(request.created_at)); const row = trend[date] ??= { date, orders: 0, contact: 0, quote: 0, custom: 0 }; row[request.kind as 'contact' | 'quote' | 'custom']++ }
  return { from, to, timezone: 'Asia/Omsk', catalog: { products: catalog.products.length, statuses: counts(catalog.products as unknown as Record<string, unknown>[], 'status'), categories: catalog.categories.length },
    orders: { count: selectedOrders.length, statuses: counts(selectedOrders as unknown as Record<string, unknown>[], 'status'), requestedValue: selectedOrders.reduce((sum, order) => sum + order.total, 0) },
    requests: { count: selectedRequests.length, kinds: counts(selectedRequests, 'kind'), statuses: counts(selectedRequests, 'status'), notifications: counts(selectedRequests, 'notification') },
    trend: Object.values(trend).sort((a, b) => a.date.localeCompare(b.date)), firstRecordAt: [...orders.map(o => o.createdAt), ...requests.map(r => String(r.created_at))].sort()[0] ?? null }
}

import { NextResponse } from 'next/server'
import { authorizeCatalogAdmin } from '@/lib/catalog/admin-api'
import { businessSnapshot, healthSnapshot } from '@/lib/monitoring/overview'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const params = new URL(request.url).searchParams
  const to = params.get('to') ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Omsk' }).format(new Date())
  const from = params.get('from') ?? new Date(Date.parse(`${to}T00:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10)
  if (![from, to].every(v => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v) || from > to || Date.parse(to) - Date.parse(from) > 366 * 86400000) return NextResponse.json({ message: 'Выберите период до 366 дней' }, { status: 400 })
  try { const [business, health] = await Promise.all([businessSnapshot(from, to), healthSnapshot()]); return NextResponse.json({ business, health }, { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch { return NextResponse.json({ message: 'Не удалось получить показатели. Проверьте хранилище.' }, { status: 503 }) }
}

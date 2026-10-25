import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { readSessionCookie } from "@/lib/auth/session-cookie"
import { recordVisit } from "@/lib/analytics/visit-store"

export const runtime = "nodejs"
const visitorCookie = "sib_trade_visitor"
const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function deviceInfo(userAgent: string) {
  const device = /iPad|Tablet|PlayBook|Silk\//i.test(userAgent) ? "Планшет" : /Mobi|Android|iPhone|iPod/i.test(userAgent) ? "Телефон" : "Компьютер"
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Firefox\//.test(userAgent) ? "Firefox" : /OPR\//.test(userAgent) ? "Opera" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent) ? "Safari" : "Другой браузер"
  const platform = /Windows/i.test(userAgent) ? "Windows" : /Android/i.test(userAgent) ? "Android" : /iPhone|iPad|iPod/i.test(userAgent) ? "iOS" : /Mac OS/i.test(userAgent) ? "macOS" : /Linux/i.test(userAgent) ? "Linux" : "Другая система"
  return { device, browser, platform }
}

function safePath(value: unknown) {
  if (typeof value !== "string" || value.length > 500 || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/") || value.startsWith("/admin")) return null
  return value.split(/[?#]/, 1)[0] || "/"
}

function safeSource(value: unknown) {
  if (typeof value !== "string" || !value || value.length > 2000) return "Прямой переход"
  try {
    const url = new URL(value)
    if (!["http:", "https:"].includes(url.protocol)) return "Прямой переход"
    return `${url.hostname}${url.pathname}`.slice(0, 255)
  } catch { return "Прямой переход" }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 4096) return NextResponse.json({ ok: false }, { status: 413 })
    const body = await request.json() as { page?: unknown; source?: unknown; visitorId?: unknown }
    const page = safePath(body.page)
    if (!page) return NextResponse.json({ ok: false }, { status: 400 })

    const cookieStore = await cookies()
    const storedId = cookieStore.get(visitorCookie)?.value
    const cookieVisitorId = storedId && visitorPattern.test(storedId) ? storedId : null
    const requestVisitorId = typeof body.visitorId === "string" && visitorPattern.test(body.visitorId) ? body.visitorId : null
    const visitorId = cookieVisitorId ?? requestVisitorId ?? randomUUID()
    const session = readSessionCookie(cookieStore.get("sib_trade_session")?.value)
    const user = session?.role === "customer" ? session : null
    const agent = deviceInfo(request.headers.get("user-agent") ?? "")
    recordVisit({ visitorId, userId: user?.id ?? null, email: user?.email ?? null, page, source: safeSource(body.source), ...agent, visitedAt: new Date().toISOString() })

    const response = NextResponse.json({ ok: true, visitorId }, { headers: { "Cache-Control": "no-store" } })
    if (cookieVisitorId !== visitorId) response.cookies.set(visitorCookie, visitorId, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

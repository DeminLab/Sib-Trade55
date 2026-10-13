import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validators"
import { authenticateDemoUser, isDemoAuthEnabled } from "@/lib/auth/demo-auth"
import { adminSessionCookie, createSessionCookieValue } from "@/lib/auth/session-cookie"
import { authenticateAdminAccount, ensureConfiguredAdminAccount, hasAdminAccount } from "@/lib/auth/admin-accounts.mjs"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  await ensureConfiguredAdminAccount()
  const admin = await authenticateAdminAccount(parsed.data.email, parsed.data.password)
  const session = admin
    ? { user: { ...admin, role: "admin" as const, addresses: [] }, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
    : authenticateDemoUser(parsed.data.email, parsed.data.password)
  if (session) {
    const response = NextResponse.json(session)
    const value = createSessionCookieValue(session.user)
    if (!value) return NextResponse.json({ message: "Вход администратора не настроен на сервере" }, { status: 503 })
    const secureCookie = process.env.AUTH_COOKIE_SECURE === "true" || (process.env.AUTH_COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production")
    response.cookies.set(adminSessionCookie.name, value, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: adminSessionCookie.maxAge })
    return response
  }
  const isAdminAuthConfigured = Boolean(hasAdminAccount() && process.env.AUTH_SESSION_SECRET)
  if (isDemoAuthEnabled() || isAdminAuthConfigured) {
    return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 })
  }
  return NextResponse.json({ message: "Авторизация будет доступна после подключения backend-сервиса" }, { status: 503 })
}

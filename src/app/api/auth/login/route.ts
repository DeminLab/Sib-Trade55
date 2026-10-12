import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validators"
import { authenticateDemoUser, isDemoAuthEnabled } from "@/lib/auth/demo-auth"
import { adminSessionCookie, createSessionCookieValue } from "@/lib/auth/session-cookie"

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  const session = authenticateDemoUser(parsed.data.email, parsed.data.password)
  if (session) {
    const response = NextResponse.json(session)
    const value = createSessionCookieValue(session.user)
    if (!value) return NextResponse.json({ message: "Вход администратора не настроен на сервере" }, { status: 503 })
    const secureCookie = process.env.AUTH_COOKIE_SECURE === "true" || (process.env.AUTH_COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production")
    response.cookies.set(adminSessionCookie.name, value, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: adminSessionCookie.maxAge })
    return response
  }
  const isAdminAuthConfigured = Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD && process.env.AUTH_SESSION_SECRET)
  if (isDemoAuthEnabled() || isAdminAuthConfigured) {
    return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 })
  }
  return NextResponse.json({ message: "Авторизация будет доступна после подключения backend-сервиса" }, { status: 503 })
}

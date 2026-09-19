import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/validators"
import { isDemoAuthEnabled, registerDemoUser } from "@/lib/auth/demo-auth"

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  const session = registerDemoUser(parsed.data)
  if (session) return NextResponse.json(session, { status: 201 })
  if (!isDemoAuthEnabled()) return NextResponse.json({ message: "Регистрация будет доступна после подключения backend-сервиса" }, { status: 503 })
  return NextResponse.json({ message: "Не удалось создать аккаунт" }, { status: 500 })
}

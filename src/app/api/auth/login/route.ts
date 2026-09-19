import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validators"
import { ServiceNotConfiguredError } from "@/lib/services"

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  try {
    throw new ServiceNotConfiguredError("Authentication")
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? "Авторизация будет доступна после подключения backend-сервиса" : "Сервис временно недоступен" }, { status: 503 })
  }
}

import { NextResponse } from "next/server"
import { quoteRequestRepository, ServiceNotConfiguredError } from "@/lib/services"
import type { QuoteRequest } from "@/types"

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as QuoteRequest | null
  if (!payload) return NextResponse.json({ message: "Некорректное тело запроса" }, { status: 400 })
  try {
    await quoteRequestRepository.create(payload)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    const message = error instanceof ServiceNotConfiguredError ? "Приём запросов КП будет доступен после подключения backend-сервиса" : "Не удалось принять запрос КП"
    return NextResponse.json({ message }, { status: 503 })
  }
}

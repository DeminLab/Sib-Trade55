import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Заказ будет загружаться из backend-сервиса после его подключения" }, { status: 503 })
}

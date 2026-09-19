import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Заказы будут загружаться из backend-сервиса после его подключения" }, { status: 503 })
}

export async function POST() {
  return NextResponse.json({ message: "Оформление заказа недоступно до подключения order/payment backend" }, { status: 503 })
}

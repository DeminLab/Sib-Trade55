import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Admin dashboard будет доступен после подключения backend-сервиса" }, { status: 503 })
}

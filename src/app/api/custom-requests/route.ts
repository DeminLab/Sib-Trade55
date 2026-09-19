import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "Приём заявок на подбор и поставку будет доступен после подключения сервиса поставок" }, { status: 503 })
}

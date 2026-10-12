import { NextResponse } from "next/server"
import { createCustomerRequest } from "@/lib/requests/request-store"
import { quoteRequestSchema } from "@/lib/requests/validation"
import { readRequestJson, RequestBodyTooLargeError } from "@/lib/requests/request-body"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const parsed = quoteRequestSchema.safeParse(await readRequestJson(request))
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные заявки" }, { status: 400 })
    const receipt = await createCustomerRequest({ kind: "quote", data: parsed.data })
    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ message: "Запрос КП слишком большой" }, { status: 413 })
    return NextResponse.json({ message: "Не удалось сохранить запрос КП. Попробуйте ещё раз" }, { status: 500 })
  }
}

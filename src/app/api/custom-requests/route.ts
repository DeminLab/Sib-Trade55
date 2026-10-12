import { NextResponse } from "next/server"
import { createCustomerRequest } from "@/lib/requests/request-store"
import { attachmentExtensions, customRequestSchema, maxAttachmentCount, maxAttachmentSize } from "@/lib/requests/validation"
import { readRequestBody, RequestBodyTooLargeError } from "@/lib/requests/request-body"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let form: FormData | null
  try {
    const bytes = await readRequestBody(request, 52 * 1024 * 1024)
    form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null)
  } catch (error) {
    return NextResponse.json({ message: error instanceof RequestBodyTooLargeError ? "Общий размер заявки превышает 52 МБ" : "Не удалось прочитать форму" }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 })
  }
  if (!form) return NextResponse.json({ message: "Некорректная форма" }, { status: 400 })
  const parsed = customRequestSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные заявки" }, { status: 400 })
  const entries = form.getAll("files")
  const files = entries.filter((entry): entry is File => typeof entry !== "string" && entry.size > 0)
  if (entries.some((entry) => typeof entry === "string") || files.length > maxAttachmentCount || files.some((file) => file.size > maxAttachmentSize || !attachmentExtensions.test(file.name))) {
    return NextResponse.json({ message: "Прикрепите до 5 файлов PDF, JPG, PNG, DWG или DXF размером до 10 МБ каждый" }, { status: 400 })
  }
  try {
    return NextResponse.json(await createCustomerRequest({ kind: "custom", data: parsed.data }, files), { status: 201 })
  } catch {
    return NextResponse.json({ message: "Не удалось сохранить заявку. Попробуйте ещё раз" }, { status: 500 })
  }
}

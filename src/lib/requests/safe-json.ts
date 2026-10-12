import { NextResponse } from 'next/server'
import { readRequestBody, RequestBodyTooLargeError } from './request-body'
export async function safeJson(request: Request, maxBytes = 512 * 1024): Promise<{ data: unknown } | { error: NextResponse }> {
  try { const bytes = await readRequestBody(request, maxBytes); return { data: JSON.parse(new TextDecoder().decode(bytes)) } }
  catch (error) { return { error: NextResponse.json({ message: error instanceof RequestBodyTooLargeError ? 'Слишком большой запрос' : 'Некорректный JSON' }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 }) } }
}

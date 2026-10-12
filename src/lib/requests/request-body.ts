export class RequestBodyTooLargeError extends Error {}

// Bound the streamed body as well as Content-Length before parsing JSON/files.
export async function readRequestBody(request: Request, maxBytes: number) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestBodyTooLargeError()
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new RequestBodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

export async function readRequestJson(request: Request) {
  const bytes = await readRequestBody(request, 512 * 1024)
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown }
  catch { return null }
}

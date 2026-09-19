export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = "ApiClientError"
  }
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  })
  const body = (await response.json().catch(() => ({}))) as { message?: string }

  if (!response.ok) {
    throw new ApiClientError(response.status, body.message ?? "Сервис временно недоступен")
  }

  return body as T
}

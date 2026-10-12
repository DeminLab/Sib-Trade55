import type { Instrumentation } from 'next'
export const onRequestError: Instrumentation.onRequestError = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { recordServerError } = await import('@/lib/monitoring/errors')
    recordServerError()
  }
}

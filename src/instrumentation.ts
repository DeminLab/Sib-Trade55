import type { Instrumentation } from 'next'
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureConfiguredAdminAccount } = await import('@/lib/auth/admin-accounts.mjs')
    await ensureConfiguredAdminAccount()
  }
}

export const onRequestError: Instrumentation.onRequestError = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { recordServerError } = await import('@/lib/monitoring/errors')
    recordServerError()
  }
}

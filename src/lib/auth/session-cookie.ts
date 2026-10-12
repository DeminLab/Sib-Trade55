import { createHmac, timingSafeEqual } from "node:crypto"

const COOKIE_NAME = "sib_trade_session"
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || (process.env.NODE_ENV === "production" ? null : "local-development-session-secret")
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function createSessionCookieValue(user: { id: string; email: string; role: string }) {
  const secret = sessionSecret()
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000 })).toString("base64url")
  return `${payload}.${signature(payload, secret)}`
}

export function readSessionCookie(value?: string) {
  const secret = sessionSecret()
  if (!secret || !value) return null
  const [payload, suppliedSignature, extra] = value.split(".")
  if (!payload || !suppliedSignature || extra) return null
  const expected = Buffer.from(signature(payload, secret))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; expiresAt?: number; id?: string; email?: string; firstName?: string; lastName?: string }
    return ['admin', 'customer'].includes(user.role ?? '') && typeof user.expiresAt === 'number' && user.expiresAt > Date.now() ? user : null
  } catch {
    return null
  }
}

export function isAdminSessionCookie(value?: string) { return readSessionCookie(value)?.role === 'admin' }

export const adminSessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_LIFETIME_SECONDS,
}

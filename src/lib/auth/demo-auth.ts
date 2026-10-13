import type { AuthSession, User } from "@/types"

const DEMO_PASSWORD = process.env.DEMO_AUTH_PASSWORD ?? "password123"

const DEMO_ACCOUNTS = [
  { email: "demo@example.com", firstName: "Demo", lastName: "Customer", role: "customer" },
] as const

export function isDemoAuthEnabled() {
  return process.env.NODE_ENV !== "production"
}

function createUser(
  input?: Partial<Pick<User, "firstName" | "lastName" | "email" | "role">>,
): User {
  const now = new Date().toISOString()
  const account = DEMO_ACCOUNTS.find((item) => item.email === input?.email)

  return {
    id: `demo-${crypto.randomUUID()}`,
    email: input?.email ?? account?.email ?? "demo@example.com",
    firstName: input?.firstName ?? account?.firstName ?? "Demo",
    lastName: input?.lastName ?? account?.lastName ?? "Customer",
    role: input?.role ?? account?.role ?? "customer",
    addresses: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function authenticateDemoUser(email: string, password: string): AuthSession | null {
  const normalizedEmail = email.trim().toLowerCase()
  const account = DEMO_ACCOUNTS.find((item) => item.email === normalizedEmail)

  if (isDemoAuthEnabled()) {
    if (!account || password !== DEMO_PASSWORD) return null
    return {
      user: createUser(account),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  return null
}

export function registerDemoUser(data: { firstName: string; lastName: string; email: string }): AuthSession | null {
  if (!isDemoAuthEnabled()) return null

  return {
    user: createUser(data),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

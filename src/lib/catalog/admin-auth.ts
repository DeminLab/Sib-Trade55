import { cookies } from "next/headers"

import { adminSessionCookie, isAdminSessionCookie } from "@/lib/auth/session-cookie"

export async function isCatalogAdmin() {
  const cookieStore = await cookies()
  return isAdminSessionCookie(cookieStore.get(adminSessionCookie.name)?.value)
}

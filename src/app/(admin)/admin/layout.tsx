import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { adminSessionCookie, isAdminSessionCookie } from "@/lib/auth/session-cookie"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get(adminSessionCookie.name)?.value

  if (!isAdminSessionCookie(session)) {
    redirect("/auth/login?next=%2Fadmin")
  }

  return <AdminShell>{children}</AdminShell>
}

"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"

export function useAuthGuard() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [mounted, isAuthenticated, router])

  return {
    user,
    isAuthenticated,
    isLoading: !mounted,
    isReady: mounted && isAuthenticated,
  }
}

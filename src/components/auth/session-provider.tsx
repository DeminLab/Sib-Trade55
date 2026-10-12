"use client"
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/auth/session', { cache: 'no-store', signal: ctrl.signal }).then(async res => {
      if (!res.ok) throw new Error('Session unavailable')
      const { user } = await res.json()
      if (!ctrl.signal.aborted && !useAuthStore.getState().user) useAuthStore.setState({ user, isAuthenticated: Boolean(user), sessionReady: true })
    }).catch(() => { if (!ctrl.signal.aborted) useAuthStore.setState({ sessionReady: true }) })
    return () => ctrl.abort()
  }, [])
  return children
}

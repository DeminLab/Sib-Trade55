"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export function SiteVisitTracker() {
  const pathname = usePathname()
  const firstPath = useRef(true)

  useEffect(() => {
    const source = firstPath.current ? document.referrer : ""
    firstPath.current = false
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, source }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}

"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const visitorStorageKey = "sib-trade-visitor-id"
const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getVisitorId() {
  try {
    const storedId = window.localStorage.getItem(visitorStorageKey)
    if (storedId && visitorPattern.test(storedId)) return storedId
    const visitorId = window.crypto.randomUUID()
    window.localStorage.setItem(visitorStorageKey, visitorId)
    return visitorId
  } catch {
    return null
  }
}

export function SiteVisitTracker() {
  const pathname = usePathname()
  const firstPath = useRef(true)

  useEffect(() => {
    const source = firstPath.current ? document.referrer : ""
    firstPath.current = false
    const visitorId = getVisitorId()
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, source, visitorId }),
      keepalive: true,
    }).then(async (response) => {
      if (!response.ok || !visitorId) return
      const data = await response.json().catch(() => null) as { visitorId?: unknown } | null
      if (typeof data?.visitorId === "string" && visitorPattern.test(data.visitorId)) {
        window.localStorage.setItem(visitorStorageKey, data.visitorId)
      }
    }).catch(() => {})
  }, [pathname])

  return null
}

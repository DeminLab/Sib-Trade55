"use client"

import { useSyncExternalStore } from "react"
import { X } from "lucide-react"
import { siteConfig } from "@/lib/config"

export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("announcement-change", onStoreChange)
      return () => window.removeEventListener("announcement-change", onStoreChange)
    },
    () => sessionStorage.getItem("announcement-dismissed") === "true",
    () => false,
  )

  function handleDismiss() {
    sessionStorage.setItem("announcement-dismissed", "true")
    window.dispatchEvent(new Event("announcement-change"))
  }

  if (dismissed || !siteConfig.announcement) return null

  return (
    <div className="relative bg-foreground px-4 py-2.5 text-center text-xs font-medium text-background sm:text-sm">
      <p>{siteConfig.announcement}</p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-background/60 hover:text-background"
        aria-label="Закрыть уведомление"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

"use client"

import { useSyncExternalStore } from "react"
import { X } from "lucide-react"
import { useSiteSettings } from './site-settings-provider'

export function AnnouncementBar() {
  const siteConfig = useSiteSettings()
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
    <div className="relative bg-foreground px-12 py-2.5 text-center text-xs font-medium text-background sm:text-sm">
      <p>{siteConfig.announcement}<a href={`tel:${siteConfig.contact.phone}`} className="ml-6 hidden underline-offset-4 hover:underline sm:inline">{siteConfig.contact.phoneDisplay}</a></p>
      <button
        onClick={handleDismiss}
        className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-sm text-background/60 hover:text-background"
        aria-label="Закрыть уведомление"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

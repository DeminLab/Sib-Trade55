"use client"

import { Phone } from "lucide-react"
import { useSiteSettings } from "@/components/layout/site-settings-provider"
import { Button } from "@/components/ui/button"

export function SalesContact() {
  const { contact } = useSiteSettings()
  return (
    <div className="mt-6 border-t border-border pt-5 text-left">
      <p className="text-sm font-semibold">Удобнее обсудить по телефону?</p>
      <p className="mt-2 text-sm text-muted-foreground">Звоните: {contact.workingHours} · время Омска (UTC+6).</p>
      <Button variant="outline" className="mt-3 min-h-11" asChild>
        <a href={`tel:${contact.phone}`}><Phone className="mr-2 size-4" />{contact.phoneDisplay}</a>
      </Button>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Заявку можно оставить в любое время. Ответим в рабочие часы.</p>
    </div>
  )
}

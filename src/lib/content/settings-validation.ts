import { z } from 'zod'
import { siteConfig } from '@/lib/config'
import { primaryNav } from '@/lib/navigation'
const text = z.string().trim().max(300)
const phone = text.regex(/^[+\d ()-]{3,40}$/, 'Проверьте телефон')
const webLink = z.string().max(2048).refine(v => v === '' || /^https:\/\//.test(v), 'Используйте https://')
export const settingsSchema = z.object({
  name: text.min(2), tagline: text, description: z.string().max(2000), announcement: text,
  contact: z.object({ email: z.string().email(), phone, phoneDisplay: text, phoneSecondary: phone, workingHours: text,
    messengers: z.object({ whatsapp: webLink, telegram: webLink }), address: z.object({ city: text }),
    requisites: z.object({ legalName: text, shortName: text, inn: text, kpp: text, ogrn: text, ogrnRegisteredAt: text, bank: text, checkingAccount: text, correspondentAccount: text, bik: text }),
  }),
  navigation: z.array(z.object({ name: text.min(1), href: z.string().max(200).regex(/^\/(?!\/|api(?:\/|$)|admin(?:\/|$))[a-z0-9/?=&-]*$/, 'Используйте внутренний адрес страницы') })).max(20),
})
export type EditableSettings = z.infer<typeof settingsSchema>
export const defaultSettings: EditableSettings = { name: siteConfig.name, tagline: siteConfig.tagline, description: siteConfig.description, announcement: siteConfig.announcement, contact: siteConfig.contact, navigation: primaryNav }

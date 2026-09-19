export const defaultLocale = "ru" as const
export const locales = ["ru", "en"] as const

export type Locale = (typeof locales)[number]

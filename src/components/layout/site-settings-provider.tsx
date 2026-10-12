"use client"
import { createContext, useContext } from 'react'
import { siteConfig } from '@/lib/config'
import { primaryNav } from '@/lib/navigation'
import type { EditableSettings } from '@/lib/content/settings-validation'
const Context = createContext<EditableSettings>({ ...siteConfig, navigation: primaryNav })
export function SiteSettingsProvider({ value, children }: { value: EditableSettings; children: React.ReactNode }) { return <Context.Provider value={value}>{children}</Context.Provider> }
export function useSiteSettings() { const value = useContext(Context); return { ...siteConfig, ...value } }

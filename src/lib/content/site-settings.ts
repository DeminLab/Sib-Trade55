import { readSqliteState } from '@/lib/database/sqlite-store'
import { defaultSettings, type EditableSettings } from './settings-validation'
export async function getSiteSettings(): Promise<EditableSettings> {
  return await readSqliteState<EditableSettings>('site:settings') ?? defaultSettings
}

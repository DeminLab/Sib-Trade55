import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
const { ensureConfiguredAdminAccount } = await import('../src/lib/auth/admin-accounts.mjs')
const result = await ensureConfiguredAdminAccount()
if (!result) {
  console.error('Задайте ADMIN_EMAIL и ADMIN_PASSWORD в локальном или серверном окружении')
  process.exitCode = 1
} else {
  console.log(result.created ? 'Аккаунт администратора создан в SQLite' : 'Аккаунт администратора уже существует; пароль сохранён')
}

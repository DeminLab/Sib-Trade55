import { createInterface } from 'node:readline/promises'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
const { createAdminAccount, updateAdminPassword } = await import('../src/lib/auth/admin-accounts.mjs')

function askHidden(prompt) {
  const input = process.stdin
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.reject(new Error('Запустите команду в интерактивном терминале'))
  }

  return new Promise((resolve, reject) => {
    let value = ''
    let settled = false
    const restore = () => {
      input.off('data', onData)
      input.setRawMode(false)
      input.pause()
      process.stdout.write('\n')
    }
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          settled = true
          restore()
          reject(new Error('Операция отменена'))
          return
        }
        if (character === '\r' || character === '\n') {
          if (!settled) {
            settled = true
            restore()
            resolve(value)
          }
          return
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('')
        } else if (character >= ' ') {
          value += character
        }
      }
    }

    process.stdout.write(prompt)
    input.setEncoding('utf8')
    input.setRawMode(true)
    input.resume()
    input.on('data', onData)
  })
}

async function main() {
  const action = process.argv[2] ?? 'create'
  if (action !== 'create' && action !== 'reset') {
    throw new Error('Использование: node scripts/create-admin.mjs [create|reset]')
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout })
  const email = (await terminal.question('Email администратора: ')).trim()
  const name = action === 'create' ? (await terminal.question('Имя администратора: ')).trim() : ''
  terminal.close()

  const password = await askHidden('Пароль (не короче 8 символов, ввод скрыт): ')
  const confirmation = await askHidden('Повторите пароль: ')
  if (password !== confirmation) throw new Error('Пароли не совпадают')

  if (action === 'create') {
    const result = await createAdminAccount({ email, password, name })
    if (!result.created) throw new Error('Аккаунт уже существует. Для смены пароля запустите команду с аргументом reset.')
    console.log(`Аккаунт администратора создан: ${result.user.email}`)
    return
  }

  const account = await updateAdminPassword({ email, password })
  if (!account) throw new Error('Аккаунт с такой почтой не найден')
  console.log(`Пароль администратора обновлён: ${account.email}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Не удалось сохранить аккаунт администратора')
  process.exitCode = 1
})

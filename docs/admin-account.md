# Постоянный администратор

Администраторы сохраняются в таблице `admin_accounts` базы `data/catalog.sqlite` (или базы из `SQLITE_DATABASE_PATH`). Email и scrypt-хеш пароля хранятся в SQLite. Пароль не записывается в `.env`, аргументы процесса или историю shell. При запуске приложения аккаунт не создаётся автоматически.

Интерактивное создание администратора. Пароль вводится скрыто и запрашивается дважды:

```powershell
npm run admin:create
```

На production-сервере после обновления Docker-образа создайте администратора внутри контейнера:

```bash
docker compose exec -it app node scripts/create-admin.mjs
```

Для смены пароля существующего аккаунта:

```bash
docker compose exec -it app node scripts/create-admin.mjs reset
```

Аккаунты сохраняются в постоянном томе `sib_trade_data` и переживают пересборку контейнера. `AUTH_SESSION_SECRET` остаётся в `.env`: он нужен для подписи сессий, но не содержит учётных данных. Смена секрета завершает действующие сессии. Вход — `/auth/login`, панель — `/admin`. Демо-аккаунты доступны только в разработке.

Пароль хранится как scrypt-хеш с отдельной случайной солью; в ответы API хеш не попадает. Параметры `N=32768, r=8, p=3` соответствуют одному из [рекомендованных вариантов OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Используется встроенная [реализация Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback). Пароли, хеши, `.env` и SQLite не коммитятся.

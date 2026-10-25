# Запуск и эксплуатация

[README](../README.md) · [Архитектура](architecture/backend-api.md) · [Заявки](requests.md)

Документация сверена с конфигурацией 9 октября 2026 года. Описанные команды не подтверждают доступность публичного сайта или прохождение Docker-проверки.

## Окружение

Нужен Node.js >= 22.13.0. Для контейнеров — Docker Compose и Linux-контейнеры. `.env.example` содержит пример имён переменных; рабочий `.env` не хранится в Git. Создание файла без перезаписи существующего:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
  Copy-Item -LiteralPath .env.example -Destination .env
}
```

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Канонический URL, metadata и ссылки; задаётся до сборки |
| `AUTH_SESSION_SECRET` | Секрет подписи сессии; обязателен для production-входа |
| `AUTH_COOKIE_SECURE` | `true` — HTTPS cookie, `false` — разрешение HTTP; по умолчанию включено в production |
| `DEMO_AUTH_PASSWORD` | Пароль демонстрационных аккаунтов вне production |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Уведомления об обращениях, КП и ТЗ |
| `SQLITE_DATABASE_PATH` | Явный путь к SQLite, приоритетнее переменных каталога данных |
| `SQLITE_DATA_DIR`, `CATALOG_DATA_DIR`, `ORDERS_DATA_DIR` | Каталог данных: первое заданное значение в этом порядке, иначе `data/` относительно cwd |
| `CATALOG_SEED_FILE` | Legacy JSON каталога, иначе `catalog.json` в каталоге данных |
| `DATABASE_URL` или `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Перенос прежнего каталога и заказов из PostgreSQL при первичной инициализации |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Настройка PostgreSQL в production Compose; пароль обязателен |
| `NEXT_PUBLIC_API_BASE_URL` | Опциональный адрес внешних API-адаптеров; сам по себе не переключает доменные репозитории |

При заданном PostgreSQL его ошибка соединения может сорвать первичную инициализацию: автоматический обход ошибки не предусмотрен. Не указывайте эти параметры для прямого запуска, если перенос не нужен.

`src/lib/env.ts` проверяет только `NODE_ENV` и `NEXT_PUBLIC_BASE_URL`; он не проверяет весь набор выше. После изменения серверных настроек перезапустите приложение. Для `NEXT_PUBLIC_*` в production нужна новая сборка.

## Next.js на хосте

```powershell
npm ci
npm run dev:next
```

Использует `.env*` из корня проекта и обычно `data/catalog.sqlite`. Прямой запуск не требует PostgreSQL, если параметры переноса не заданы. Сайт: [localhost:3000](http://localhost:3000).

Для LAN получите текущий адрес через `Get-NetIPAddress -AddressFamily IPv4`, выберите активный сетевой интерфейс и откройте `http://<IPv4>:3000`. Проверьте доступ с другого устройства и правила брандмауэра. `allowedDevOrigins` в `next.config.ts` сейчас содержит `192.168.0.110`; при другом адресе настройку нужно обновить.

## Docker development

```powershell
npm run dev
# Остановка:
npm run dev:docker:down
```

`docker-compose.dev.yml` запускает PostgreSQL и Next.js на порту 3000 с hot reload. Исходники подключены bind mount, `node_modules`, `.next`, PostgreSQL и `/app/data` — отдельные named volumes. Рабочая SQLite база находится в томе `sib_trade_dev_data`, а не в хостовой папке `data/`.

Compose передаёт `DEMO_AUTH_PASSWORD` и Telegram, но не передаёт `AUTH_SESSION_SECRET`, `AUTH_COOKIE_SECURE` и `SQLITE_DATABASE_PATH` через `environment`. Хостовый `.env` виден через bind mount, однако production Compose исключает `.env` из образа. Не полагайтесь на одинаковые настройки двух режимов: проверяйте явное окружение сервиса. Локальная Docker-витрина использует `NEXT_PUBLIC_BASE_URL=http://localhost:3000`.

Не запускайте хостовый сервер и development Compose одновременно на одном порту.

## Локальная production-сборка

```powershell
npm run build
$env:HOSTNAME = '0.0.0.0'
$env:PORT = '3000'
$env:SQLITE_DATABASE_PATH = Join-Path (Get-Location).Path 'data/catalog.sqlite'
node --env-file=.env .next/standalone/server.js
```

Для запуска через `npm start` предварительно загрузите серверные переменные в окружение процесса. Явный абсолютный путь к SQLite предотвращает выбор другой базы при смене рабочего каталога standalone.

Сборка использует `output: 'standalone'`; скрипт `scripts/copy-standalone-assets.mjs` копирует `public` и `.next/static`. Эти ресурсы обязательны для изображений и стилей. Сборка может обращаться к хранилищу при генерации страниц; для изолированной проверки задайте отдельный `SQLITE_DATABASE_PATH` до `npm run build`.

При локальной проверке production через HTTP вход требует `AUTH_COOKIE_SECURE=false`. В публичной HTTPS-среде используйте защищённую cookie.

## Docker production

В `.env` заполните секрет сессии, пароль PostgreSQL и канонический URL до сборки. Администратор создаётся интерактивной CLI-командой внутри контейнера; не храните его email и пароль в `.env`.
Перед первым публичным запуском укажите DNS на сервер и получите TLS-сертификат по инструкции ниже; Nginx не стартует без смонтированных файлов сертификата.

```powershell
docker compose up --build -d
docker compose ps
# HTTP reverse proxy:
Invoke-WebRequest http://localhost/nginx-health
Invoke-WebRequest http://localhost/
# Остановка с сохранением данных:
docker compose down
```

После первого запуска создайте администратора командой `docker compose exec -it app node scripts/create-admin.mjs`. Сменить пароль существующего аккаунта можно командой `docker compose exec -it app node scripts/create-admin.mjs reset`.

`docker-compose.yml` запускает PostgreSQL, standalone-приложение и Nginx. Приложение слушает внутренний порт 3000, Nginx публикует порты 80 и 443. До запуска Nginx на хосте должны существовать сертификаты `/etc/letsencrypt/live/sib-trade55.ru/fullchain.pem` и `privkey.pem`; Compose монтирует `/etc/letsencrypt` в контейнер только для чтения. SQLite находится в `/app/data/catalog.sqlite` в томе `sib_trade_data`. Production Compose не передаёт `SQLITE_DATABASE_PATH` из `.env`; изменение пути требует правки окружения сервиса и соответствующего volume.

`.dockerignore` исключает локальные `data/` и `.env*` из контекста сборки. Хостовая база не переносится в production автоматически. PostgreSQL остаётся зависимостью приложения в Compose, хотя после переноса рабочие данные читаются и записываются в SQLite.

На сервере укажите A-записи `sib-trade55.ru` и `www.sib-trade55.ru` на его IPv4 и откройте входящие TCP-порты 80 и 443. До первого запуска Compose получите сертификат Certbot в standalone-режиме, когда порт 80 свободен:

```bash
sudo certbot certonly --standalone --preferred-challenges http \
  --agree-tos --no-eff-email --email you@example.com \
  -d sib-trade55.ru -d www.sib-trade55.ru
```

Если Nginx Compose уже работает, перед Certbot остановите только его (`docker compose stop nginx`), затем запустите снова (`docker compose start nginx`). Nginx перенаправляет HTTP на HTTPS для основного домена; `dev.sib-trade55.ru` перенаправляет в защищённый `/admin` на основном домене. Для production установите `AUTH_COOKIE_SECURE=true` в `.env`.

Сертификат был выдан standalone-проверкой, поэтому порт 80 потребуется освободить и при автоматическом продлении. Certbot создаёт системный таймер при установке через Snap; добавьте хуки, чтобы при необходимости продления остановить и затем запустить Nginx:

```bash
sudo install -d /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/post
sudo tee /etc/letsencrypt/renewal-hooks/pre/10-sib-trade-nginx >/dev/null <<'EOF'
#!/bin/sh
/usr/bin/docker compose -f /opt/sib-trade/docker-compose.yml stop nginx
EOF
sudo tee /etc/letsencrypt/renewal-hooks/post/10-sib-trade-nginx >/dev/null <<'EOF'
#!/bin/sh
/usr/bin/docker compose -f /opt/sib-trade/docker-compose.yml start nginx
EOF
sudo chmod 755 /etc/letsencrypt/renewal-hooks/pre/10-sib-trade-nginx /etc/letsencrypt/renewal-hooks/post/10-sib-trade-nginx
```

Проверяйте HTTPS и автоматическое продление отдельно после развёртывания. DNS, авторизацию, отправку формы, приватные файлы и реальную доставку Telegram также проверяйте отдельно.

## Резервное копирование и восстановление

SQLite содержит каталог, CMS-контент, заказы, обращения, медиа и приватные вложения. База работает в WAL-режиме. Для копии при работающем сервере используйте SQLite backup API или `VACUUM INTO`; копирование только `catalog.sqlite` не гарантирует сохранения записей из WAL.

Пример согласованной копии хостовой базы (путь должен соответствовать рабочему окружению):

```powershell
node --input-type=module -e 'import { DatabaseSync } from "node:sqlite"; import { mkdirSync } from "node:fs"; const source = process.env.SQLITE_DATABASE_PATH || "data/catalog.sqlite"; mkdirSync("data/backups", { recursive: true }); const db = new DatabaseSync(source); db.exec("PRAGMA busy_timeout = 10000"); const target = "data/backups/catalog-" + Date.now() + ".sqlite"; db.exec("VACUUM INTO " + String.fromCharCode(39) + target + String.fromCharCode(39)); db.close(); console.log(target);'
```

Для контейнера выполняйте такую операцию внутри приложения с `/app/data/catalog.sqlite`, затем выгрузите копию из тома. Храните копии вне рабочего тома; база содержит персональные данные.

Для восстановления остановите все процессы приложения, сохраните текущее состояние вместе с существующими `-wal`/`-shm`, затем замените базу проверенной копией. Старые WAL/SHM не должны оставаться рядом с восстановленной базой. Проверьте права пользователя контейнера, запустите приложение, выполните `PRAGMA quick_check` и проверьте каталог, заказы и скачивание вложений. Не используйте `docker compose down -v` при обычной остановке: это удаляет тома с данными.

## Проверки и пакет сборки — 10 октября 2026 года

Для изолированной сборки подготовьте базу QA без массового импорта изображений конкурирующими workers:

```powershell
node scripts/seed-qa.mjs data/qa-build.sqlite
$env:SQLITE_DATABASE_PATH = Join-Path $PWD 'data/qa-build.sqlite'
npm run build
Remove-Item Env:SQLITE_DATABASE_PATH
node --test tests/requests-store.test.mjs tests/sqlite-lock.test.mjs
node tests/requests.integration.mjs
node tests/site.integration.mjs
```

`seed-qa.mjs` отказывается работать с именем базы без префикса `qa-`. Не используйте его для рабочего хранилища. Изолированная сборка не подтверждает доступность фотографий в этой тестовой базе: public копируется отдельно, а рабочие BLOB-изображения проверяются в рабочей SQLite.

Output tracing игнорирует рабочие данные и широкие runtime-пути. `copy-standalone-assets.mjs` дополнительно удаляет `.env*`, `data`, `.git`, `.agents` и `tests` из **готовой standalone-директории**, затем копирует public/static. Окружение передаётся при запуске, рабочая база — через отдельный volume. Не включайте секреты или резервные копии в пакет публикации.

Для согласованной резервной копии хостовой базы доступен `node --env-file=.env scripts/backup-sqlite.mjs`. Для чтения целостности и проверки ссылок каталога — `node --env-file=.env scripts/check-catalog.mjs`.

Фактические результаты и границы: [отчёт QA](qa/REPORT-2026-10-10.md). Docker-проверка этого запуска не выполнена: Docker Desktop Linux engine недоступен, а Compose не проходит интерполяцию без POSTGRES_PASSWORD. Эти ограничения не менялись в окружении автоматически.

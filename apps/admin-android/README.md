# СИБ-ТРЕЙД Админ для Android

Приложение открывает существующую админку сайта после входа администратором. Сессия хранится в Android EncryptedSharedPreferences; пароль после входа не сохраняется. Все права доступа остаются на сервере.

## Уведомления

Приложение проверяет новые заказы, обращения, запросы КП и заявки по ТЗ. Когда приложение открыто, проверка выполняется раз в минуту. В фоне запросы выполняются через Android WorkManager; система Android допускает повторяющуюся работу не чаще одного раза за 15 минут и может задержать её. Нужны сеть и разрешение «Уведомления». После входа старые заявки не присылаются, отсчёт начинается с текущего времени.

Для работы APK сервер должен быть обновлён с маршрутом `/api/admin/mobile/notifications`. APK подключается к `https://sib-trade55.ru`.

## Сборка

Нужны JDK 17 или новее, Android SDK Platform 35, Build Tools 35.0.0 и принятые Android SDK licenses. При первой сборке установите SDK-пакеты; команда попросит принять лицензионные условия Google:

```powershell
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
$sdkmanager = Join-Path $sdkRoot 'cmdline-tools/latest/bin/sdkmanager.bat'
& $sdkmanager --sdk_root=$sdkRoot --licenses
& $sdkmanager --sdk_root=$sdkRoot 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'
```

После принятия лицензий собирайте APK из корня репозитория:

```powershell
./scripts/build-admin-apk.ps1
```

Debug APK будет в `apps/admin-android/app/build/outputs/apk/debug/app-debug.apk`. Для личной установки передайте APK на Android-телефон и разрешите установку из выбранного источника. Это debug-сборка без ключа публикации Google Play.

Для получения уведомлений на экране телефона при закрытом приложении WorkManager может отработать не сразу; минимальный интервал — 15 минут, точное время планирует Android. Мгновенные push-уведомления потребуют отдельного Firebase-проекта и секретов сервера, которых сейчас в проекте нет.

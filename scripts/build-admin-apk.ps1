$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$androidProject = Join-Path $projectRoot 'apps/admin-android'
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot 'platforms/android-35/android.jar'))) {
  throw "Не найден Android SDK Platform 35 в $sdkRoot. Установите платформу и примите Android SDK licenses."
}
if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot 'build-tools/35.0.0/aapt.exe'))) {
  throw "Не найдены Android Build Tools 35.0.0 в $sdkRoot. Установите их через sdkmanager."
}

Push-Location $androidProject
try { & .\gradlew.bat --no-daemon assembleDebug; if ($LASTEXITCODE -ne 0) { throw "Gradle завершился с кодом $LASTEXITCODE" } }
finally { Pop-Location }

$apkPath = Join-Path $androidProject 'app/build/outputs/apk/debug/app-debug.apk'
if (-not (Test-Path -LiteralPath $apkPath)) { throw 'Сборка завершилась без APK-файла.' }
Get-Item -LiteralPath $apkPath | Select-Object FullName, Length, LastWriteTime

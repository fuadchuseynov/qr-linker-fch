@echo off
echo.
echo QR Linker - Сборка приложения
echo ==================================
echo.

echo Установка зависимостей...
call bun install

echo.
echo Сборка проекта...
call npm run build

echo.
echo Подготовка папок...
if exist qr-linker-app rmdir /s /q qr-linker-app
mkdir qr-linker-app
xcopy dist qr-linker-app\web /E /I
copy DEPLOYMENT.md qr-linker-app\
copy package.json qr-linker-app\

(
echo # QR Linker App
echo.
echo ## 🚀 Как запустить?
echo.
echo ### На Windows:
echo 1. Откройте `web/index.html` в браузере
echo.
echo ### На мобильном:
echo Смотрите DEPLOYMENT.md для инструкции
echo.
echo **QR Linker v1.0** - Готово!
) > qr-linker-app\README.md

echo.
echo ✅ Готово!
echo.
echo Папка 'qr-linker-app' создана с файлами:
echo   - web/ (готовое приложение для браузера)
echo   - DEPLOYMENT.md (инструкция по развертыванию)
echo.
echo Распакуй эту папку на любом устройстве и открой web/index.html
echo.
pause

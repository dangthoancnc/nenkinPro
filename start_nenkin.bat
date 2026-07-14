@echo off
chcp 65001 >nul 2>&1

echo ========================================================
echo   NENKIN - USB Portable Start
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Xoa cache .next ...
if exist ".next" (
    rmdir /s /q ".next"
    echo       Xong.
) else (
    echo       Khong co, bo qua.
)

echo.
echo [2/3] Kiem tra node_modules ...
if exist "node_modules" goto SKIP_NPM

echo       Chua co. Dang cai dat ...
call npm install
if errorlevel 1 goto ERR_NPM
echo       Cai dat xong.

:SKIP_NPM
echo       Da co, bo qua.

echo.
echo [3/3] Tao Prisma Client va khoi dong ...
call npx prisma generate
if errorlevel 1 goto ERR_PRISMA

echo.
echo ========================================================
echo   http://127.0.0.1:3015
echo   Nhan Ctrl+C de dung.
echo ========================================================
echo.

:: Cho 40s de Webpack bien dich xong roi mo trinh duyet
start /b cmd /c "timeout /t 40 >nul & start http://127.0.0.1:3015"

:: Khoi dong Next.js
call npm run dev
pause
exit /b 0

:ERR_NPM
echo       LOI: npm install that bai.
pause
exit /b 1

:ERR_PRISMA
echo       LOI: prisma generate that bai.
pause
exit /b 1

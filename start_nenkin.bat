@echo off
chcp 65001 >nul 2>&1
title VietNenkin Solutions - Khoi dong He thong

echo ========================================================
echo   VIETNENKIN SOLUTIONS (VNS) - KHOI DONG HE THONG
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Uu tien dung NodeJS chinh hang tren may, tranh loi wrapper cua Conda
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

:: 2. Kiem tra va cap nhat thu vien phu thuoc (chi chay neu chua co)
echo [1/3] Kiem tra thu vien phan mem ...
if not exist "node_modules" (
    echo       Chua co node_modules. Dang cai dat thu vien (npm install)...
    call npm install
    if errorlevel 1 goto ERR_NPM
    echo       Cai dat hoan tat.
) else (
    echo       Thu vien san sang, bo qua cai dat.
)

:: 3. Khoi tao Prisma Client truc tiep (nhanh gap 5 lan so voi npx)
echo.
echo [2/3] Kiem tra cau truc co so du lieu (Prisma)...
if exist "node_modules\.bin\prisma.cmd" (
    call "node_modules\.bin\prisma.cmd" generate
) else (
    call npx --no-install prisma generate
)
if errorlevel 1 goto ERR_PRISMA

:: 4. Thong tin ket noi & Khoi dong may chu Next.js
echo.
echo [3/3] Dang khoi dong may chu VietNenkin Solutions ...
echo ========================================================
echo   Dia chi he thong:  http://127.0.0.1:3015
echo   (Trinh duyet se tu dong mo sau vai giay)
echo   Nhan Ctrl + C trong cua so nay neu muon tat he thong.
echo ========================================================
echo.

:: Tu dong mo trinh duyet sau 6 giay khi may chu bat dau san sang
start "" /b cmd /c "timeout /t 6 >nul & start http://127.0.0.1:3015"

:: Khoi dong Next.js su dung cache san co (khoi dong nhanh trong 3-5 giay)
call npm run dev
pause
exit /b 0

:ERR_NPM
echo.
echo [!] LOI: Khong the cai dat cac goi npm phu thuoc.
pause
exit /b 1

:ERR_PRISMA
echo.
echo [!] LOI: Khoi tao Prisma Client that bai.
pause
exit /b 1

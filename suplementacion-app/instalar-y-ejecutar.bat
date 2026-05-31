@echo off
echo ========================================
echo LIMPIEZA Y REINSTALACION DE DEPENDENCIAS
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Cerrando procesos de node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Eliminando node_modules (puede tardar)...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo Done.

echo [3/4] Limpiando cache de npm...
call npm cache clean --force
echo Done.

echo [4/4] Instalando dependencias...
echo (Esto tardara varios minutos)
echo.
call npm install --legacy-peer-deps

echo.
echo ========================================
echo INSTALACION COMPLETA
echo ========================================
echo.
echo Para ejecutar la app en WEB, escribe:
echo   npm run web
echo.
pause

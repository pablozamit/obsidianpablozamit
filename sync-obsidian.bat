@echo off
REM Script de sincronización de Obsidian a GitHub

setlocal enabledelayedexpansion

REM Variables
set REPO_PATH=C:\Users\paulm\obsidian-sync
set LOCAL_VAULT="H:\Otros ordenadores\Mi portátil\obsidianpablozamit"
set CONTENT_PATH=%REPO_PATH%\content

REM Ir a la carpeta del repositorio
cd /d %REPO_PATH%

REM Limpiar la carpeta content (excepto .gitkeep)
echo Limpiando carpeta content...
for /d %%A in (%CONTENT_PATH%\*) do rmdir /s /q "%%A"
for %%A in (%CONTENT_PATH%\*) do (
    if not "%%~nxA"==".gitkeep" del "%%A"
)

REM Copiar archivos nuevos de la bóveda local
echo Copiando archivos desde bóveda local...
xcopy %LOCAL_VAULT% "%CONTENT_PATH%" /E /I /Y

REM Git add, commit y push
echo Preparando cambios...
git add .

echo Creando commit...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
git commit -m "Actualización de bóveda: %mydate% %mytime%"

echo Subiendo a GitHub...
git push origin main

echo.
echo ✅ Sincronización completada!
pause

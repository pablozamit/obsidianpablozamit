@echo off
REM Wrapper para ejecutar el script de sincronización de PowerShell
REM Esto permite hacer doble clic para sincronizar

echo Iniciando sincronizador de Obsidian...
PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0sync_obsidian.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ----------------------------------------
    echo HUBO UN ERROR AL LANZAR POWERSHELL
    echo ----------------------------------------
    pause
)

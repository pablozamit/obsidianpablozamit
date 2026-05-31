# Configuración de Rutas
$Source = Resolve-Path "$PSScriptRoot\.."
$Source = $Source.Path
$Destination = "C:\Users\paulm\obsidian-sync\content"


# Forzar codificación para evitar problemas con tildes
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Iniciando Sincronizacion..." -ForegroundColor Cyan
Write-Host "Origen: $Source"
Write-Host "Destino: $Destination"
Write-Host "-----------------------------"

# 1. ROBOCOPY
Write-Host "1. Ejecutando Robocopy..." -ForegroundColor Yellow

$ExcludeDirs = @(".obsidian", ".git", ".smart-connections", ".smart-env", ".trash", "scripts", "utils", "Weeklynotes", "Biohacking Week (newsletter)", "suplementacion-app")
$ExcludeFiles = @("desktop.ini", "*.DS_Store", "*.gdoc", "inbox-links.md", "inbox-done.md")

$roboArgs = @(
    $Source,
    $Destination,
    "/MIR",
    "/FFT",
    "/R:1",
    "/W:1",
    "/XD", $ExcludeDirs,
    "/XF", $ExcludeFiles,
    "/NP",
    "/NDL"
)

# Ejecutar Robocopy
& robocopy @roboArgs

if ($LASTEXITCODE -ge 8) {
    Write-Host "ERROR CRITICO EN ROBOCOPY. Codigo: $LASTEXITCODE" -ForegroundColor Red
    Read-Host "Presiona Enter para salir..."
    Exit
}
else {
    Write-Host "Robocopy completado." -ForegroundColor Green
}

# 2. GIT
Write-Host "2. Verificando Git..." -ForegroundColor Yellow

Set-Location -Path "C:\Users\paulm\obsidian-sync"

$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Host "No hay cambios para subir." -ForegroundColor Green
}
else {
    Write-Host "Subiendo cambios a GitHub..."
    git add .
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "Obsidian Sync: $timestamp"
    
    git commit -m "$commitMsg"
    
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Reintentando con master..."
        git push origin master
    }
}

Write-Host "-----------------------------"
Write-Host "LISTO. PANTALLA SE CERRARA."
Write-Host "-----------------------------"
Start-Sleep -Seconds 5

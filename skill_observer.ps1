$logDir = "C:\Users\paulm\.local\share\opencode\storage\session_diff"
$lastCheck = Get-Date -Date "2026-02-24T08:00:00"

while ($true) {
    $newSessions = Get-ChildItem $logDir -Name "ses*.json" | Where-Object { $_.Length -gt 1000 }
    
    foreach ($session in $newSessions) {
        Write-Host "Nueva sesión detectada: $session"
        # Aquí irá el análisis de contenido
        Read-Host "Es esta una skill reusable? (s/n)"
    }
    
    Start-Sleep 30
}

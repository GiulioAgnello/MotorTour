# ============================================================
# MotorTour - Dev Watch
# Avvia Vite in watch mode e sincronizza automaticamente
# i file compilati nella cartella plugin di LocalWP.
#
# Uso: dal terminale VS Code:
#      powershell -ExecutionPolicy Bypass -File ".\dev-watch.ps1"
# ============================================================

$siteName   = "MotorTour"
$localSites = "$env:USERPROFILE\Local Sites"
$assetsSrc  = "$PSScriptRoot\motortour-plugin\assets\frontend"
$assetsDest = "$localSites\$siteName\app\public\wp-content\plugins\motortour-plugin\assets\frontend"

if (-not (Test-Path $assetsDest)) {
    Write-Host ""
    Write-Host "ATTENZIONE: cartella plugin non trovata in LocalWP." -ForegroundColor Yellow
    Write-Host "  $assetsDest" -ForegroundColor Yellow
    Write-Host ""
    $custom = Read-Host "Inserisci il percorso completo della cartella assets/frontend del plugin in LocalWP"
    if (-not (Test-Path $custom)) {
        Write-Host "Percorso non valido. Uscita." -ForegroundColor Red
        Read-Host "Premi Invio per uscire"
        exit 1
    }
    $assetsDest = $custom
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MotorTour Dev Watch" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Sorgente:     $assetsSrc" -ForegroundColor Gray
Write-Host "  Destinazione: $assetsDest" -ForegroundColor Gray
Write-Host ""
Write-Host "  Salva un file .jsx per avviare il rebuild." -ForegroundColor White
Write-Host "  Premi Ctrl+C per uscire." -ForegroundColor White
Write-Host ""

$frontendDir = "$PSScriptRoot\motortour-frontend"
$viteProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$frontendDir`" && npm run watch" -PassThru

Write-Host "[Vite] Avviato in una nuova finestra (PID $($viteProc.Id))" -ForegroundColor Green
Write-Host ""

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path                  = $assetsSrc
$watcher.Filter                = "*"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents   = $true
$watcher.NotifyFilter          = [System.IO.NotifyFilters]::LastWrite

$syncData = @{ Src = $assetsSrc; Dest = $assetsDest }

$action = {
    $file = $Event.SourceEventArgs.Name
    $time = Get-Date -Format "HH:mm:ss"
    if ($file -eq "index.js" -or $file -eq "index.css") {
        $src  = Join-Path $Event.MessageData.Src  $file
        $dest = Join-Path $Event.MessageData.Dest $file
        try {
            Copy-Item -Force $src $dest
            Write-Host "[$time] $file copiato in LocalWP OK" -ForegroundColor Green
        } catch {
            Write-Host "[$time] Errore copia $file : $_" -ForegroundColor Red
        }
    }
}

Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action -MessageData $syncData | Out-Null

Write-Host "In ascolto su $assetsSrc ..." -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    if (-not $viteProc.HasExited) {
        $viteProc.Kill()
        Write-Host ""
        Write-Host "[Vite] Processo terminato." -ForegroundColor Yellow
    }
    Write-Host "Dev watch fermato." -ForegroundColor Yellow
}

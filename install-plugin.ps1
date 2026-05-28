# ============================================================
# MotorTour – Script installazione plugin in LocalWP
# Esegui con tasto destro → "Esegui con PowerShell"
# ============================================================

$siteName   = "MotorTour"
$pluginSrc  = "$PSScriptRoot\motortour-plugin"
$localSites = "$env:USERPROFILE\Local Sites"
$pluginDest = "$localSites\$siteName\app\public\wp-content\plugins\motortour-plugin"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MotorTour Plugin Installer" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica cartella sorgente
if (-not (Test-Path $pluginSrc)) {
    Write-Host "ERRORE: Cartella plugin non trovata in:" -ForegroundColor Red
    Write-Host "  $pluginSrc" -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

# Verifica sito LocalWP
$wpPluginsDir = "$localSites\$siteName\app\public\wp-content\plugins"
if (-not (Test-Path $wpPluginsDir)) {
    Write-Host "ATTENZIONE: Sito LocalWP non trovato in:" -ForegroundColor Yellow
    Write-Host "  $wpPluginsDir" -ForegroundColor Yellow
    Write-Host ""
    $customPath = Read-Host "Inserisci il percorso completo della cartella plugins del tuo sito LocalWP"
    if (-not (Test-Path $customPath)) {
        Write-Host "Percorso non valido. Uscita." -ForegroundColor Red
        Read-Host "Premi Invio per uscire"
        exit 1
    }
    $pluginDest = "$customPath\motortour-plugin"
}

Write-Host "Sorgente:    $pluginSrc" -ForegroundColor Gray
Write-Host "Destinazione: $pluginDest" -ForegroundColor Gray
Write-Host ""

# Se il plugin esiste già, chiedi conferma aggiornamento
if (Test-Path $pluginDest) {
    Write-Host "Il plugin e' gia' installato. Aggiorno i file..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $pluginDest
}

# Copia il plugin
Write-Host "Copio il plugin..." -ForegroundColor White
Copy-Item -Recurse -Force $pluginSrc $pluginDest

if (Test-Path $pluginDest) {
    Write-Host ""
    Write-Host "INSTALLAZIONE COMPLETATA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prossimi passi:" -ForegroundColor Cyan
    Write-Host "  1. Apri LocalWP e avvia il sito '$siteName'" -ForegroundColor White
    Write-Host "  2. Vai su: http://$($siteName.ToLower()).local/wp-admin" -ForegroundColor White
    Write-Host "  3. Plugin -> Plugin installati -> Attiva 'MotorTour'" -ForegroundColor White
    Write-Host "  4. Vai su MotorTour nel menu laterale" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERRORE durante la copia. Controlla i permessi." -ForegroundColor Red
}

Read-Host "Premi Invio per uscire"

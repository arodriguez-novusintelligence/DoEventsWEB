# Limpieza total QA + usuario guía
# ADVERTENCIA: borra eventos, lugares y servicios. NO forma parte del despliegue normal.
param(
  [string]$Region = "us-east-2",
  [switch]$ConfirmFullWipe
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmFullWipe) {
  throw "Operación destructiva bloqueada. Usa -ConfirmFullWipe solo en entornos de prueba controlados."
}
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Limpieza TOTAL QA ===" -ForegroundColor Cyan
$env:AWS_REGION = $Region
$env:FULL_WIPE = "1"
node (Join-Path $scriptDir "cleanup-qa-test-data.js")

Write-Host ""
Write-Host "=== Creando usuario guía ===" -ForegroundColor Cyan
& (Join-Path $scriptDir "seed-qa-guide-user.ps1") -Region $Region

Write-Host ""
Write-Host "Listo. Limpia caché del navegador (Ctrl+F5) y localStorage." -ForegroundColor Green

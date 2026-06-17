# Elimina eventos QA con silletería antigua creados hasta hoy (inclusive)
param(
    [string]$Region = "us-east-2",
    [string]$CutoffDate = "2026-06-10T23:59:59.999Z"
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$backRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\DoEventsBack\aws-lambda-venues")
$nodeModules = Join-Path $backRoot "node_modules"

if (-not (Test-Path $nodeModules)) {
    Write-Host "Instalando dependencias en aws-lambda-venues..." -ForegroundColor Yellow
    Push-Location $backRoot
    npm install --no-audit --no-fund 2>&1 | Out-Null
    Pop-Location
}

$env:AWS_REGION = $Region
$env:CUTOFF_DATE = $CutoffDate
$env:NODE_PATH = $nodeModules

Write-Host "=== Limpieza eventos QA con silletería legada ===" -ForegroundColor Cyan
Write-Host "Región: $Region"
Write-Host "Corte: $CutoffDate"

node (Join-Path $scriptDir "cleanup-qa-legacy-seating-events.js")
if ($LASTEXITCODE -ne 0) { throw "Limpieza falló con código $LASTEXITCODE" }

Write-Host "=== Limpieza finalizada ===" -ForegroundColor Green

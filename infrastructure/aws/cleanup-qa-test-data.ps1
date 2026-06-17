# Elimina usuarios, eventos y venues de prueba en QA (prefijo qa-)
param(
    [string]$Region = "us-east-2",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$backRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\DoEventsBack\aws-lambda-venues")
$nodeModules = Join-Path $backRoot "node_modules"

if (-not (Test-Path $nodeModules)) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    Push-Location $backRoot
    npm install --no-audit --no-fund 2>&1 | Out-Null
    Pop-Location
}

$env:AWS_REGION = $Region
$env:NODE_PATH = $nodeModules
if ($DryRun) { $env:DRY_RUN = "1" } else { Remove-Item Env:DRY_RUN -ErrorAction SilentlyContinue }

Write-Host "=== Limpieza datos de prueba QA ===" -ForegroundColor Cyan
Write-Host "Región: $Region"
if ($DryRun) { Write-Host "Modo: simulación (DryRun)" -ForegroundColor Yellow }

node (Join-Path $scriptDir "cleanup-qa-test-data.js")
if ($LASTEXITCODE -ne 0) { throw "Limpieza falló con código $LASTEXITCODE" }

Write-Host "=== Limpieza finalizada ===" -ForegroundColor Green

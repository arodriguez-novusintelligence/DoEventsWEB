# Despliega servicios backend QA en us-east-2 y repara mappings del dominio api-qa
param(
  [string]$Region = "us-east-2",
  [string]$Domain = "api-qa.doeventsapp.com",
  [switch]$SkipEnvFix,
  [switch]$SkipAuthDeploy
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackRoot = Join-Path (Split-Path -Parent $Root) "DoEventsBack"

function Update-ApiMapping($MappingKey, $ApiId, $Stage) {
  $mapping = aws apigatewayv2 get-api-mappings --domain-name $Domain --region $Region `
    --query "Items[?ApiMappingKey=='$MappingKey'] | [0]" --output json | ConvertFrom-Json
  if (-not $mapping.ApiMappingId) {
    Write-Host "Creando mapping '$MappingKey' -> $ApiId ($Stage)" -ForegroundColor Yellow
    aws apigatewayv2 create-api-mapping --domain-name $Domain --region $Region `
      --api-id $ApiId --stage $Stage --api-mapping-key $MappingKey | Out-Null
    return
  }
  Write-Host "Actualizando mapping '$MappingKey' ($($mapping.ApiMappingId)) -> $ApiId ($Stage)" -ForegroundColor Yellow
  aws apigatewayv2 update-api-mapping --domain-name $Domain --region $Region `
    --api-mapping-id $mapping.ApiMappingId --api-id $ApiId --stage $Stage | Out-Null
}

function Enable-CorsOnHttpApi($ApiId) {
  aws apigatewayv2 update-api --api-id $ApiId --region $Region `
    --cors-configuration "AllowOrigins=https://qa.doeventsapp.com,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,AllowCredentials=true" `
    --output text --query "ApiId" | Out-Null
}

if (-not $SkipEnvFix) {
  Write-Host "=== Corrigiendo env vars lambdas QA ===" -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot "fix-qa-lambda-env.ps1") -Region $Region
}

if (-not $SkipAuthDeploy) {
  Write-Host "=== Desplegando auth (OTP + token + preferencias) ===" -ForegroundColor Cyan
  Push-Location (Join-Path $BackRoot "aws-lambda-generateotp")
  try {
    npm install --silent 2>$null
    $deployOut = npx serverless deploy --stage qa --region $Region 2>&1 | Out-String
    Write-Host $deployOut
    if ($deployOut -match 'endpoints:\s*\n\s*POST - https://([a-z0-9]+)\.execute-api') {
      $authApiId = $Matches[1]
    } else {
      $authApiId = aws apigatewayv2 get-apis --region $Region `
        --query "Items[?contains(Name,'aws-lambda-generateotp')].ApiId | [0]" --output text
    }
    if ($authApiId -and $authApiId -ne "None") {
      Enable-CorsOnHttpApi $authApiId
      Update-ApiMapping "auth" $authApiId '$default'
      Write-Host "Auth API mapeada: $authApiId" -ForegroundColor Green
    } else {
      Write-Warning "No se pudo detectar API ID de auth tras deploy"
    }
  } finally {
    Pop-Location
  }
}

Write-Host "=== Listo. Verifica endpoints en https://$Domain/auth/ ===" -ForegroundColor Green

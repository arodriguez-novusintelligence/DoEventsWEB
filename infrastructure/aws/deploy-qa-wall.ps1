# Redeploy wall-social-media QA (incluye aws-sdk en el paquete)
param(
  [string]$Region = "us-east-2",
  [string]$Domain = "api-qa.doeventsapp.com"
)

$ErrorActionPreference = "Stop"
$BackRoot = Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))) "DoEventsBack"
$InfraDir = $PSScriptRoot
$servicePath = Join-Path $BackRoot "aws-lambda-wall-social-media"

Write-Host "=== Corrigiendo env vars wall QA ===" -ForegroundColor Cyan
& (Join-Path $InfraDir "fix-qa-lambda-env.ps1") -Region $Region

Write-Host "=== Instalando dependencias wall ===" -ForegroundColor Cyan
Push-Location $servicePath
try {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install falló" }

  Write-Host "=== Desplegando wall-social-media (stage qa) ===" -ForegroundColor Cyan
  $out = npx serverless deploy --stage qa --region $Region 2>&1 | Out-String
  Write-Host $out

  $apiId = ($out | Select-String -Pattern 'https://([a-z0-9]+)\.execute-api' -AllMatches).Matches[0].Groups[1].Value
  if ($apiId) {
    Write-Host "Actualizando mapping wall -> $apiId" -ForegroundColor Yellow
    $mapping = aws apigatewayv2 get-api-mappings --domain-name $Domain --region $Region `
      --query "Items[?ApiMappingKey=='wall'] | [0]" --output json | ConvertFrom-Json
    if ($mapping.ApiMappingId) {
      aws apigatewayv2 update-api-mapping --domain-name $Domain --region $Region `
        --api-mapping-id $mapping.ApiMappingId --api-id $apiId --stage qa | Out-Null
    }
    aws apigatewayv2 update-api --api-id $apiId --region $Region `
      --cors-configuration "AllowOrigins=https://qa.doeventsapp.com,http://localhost:5173,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,AllowCredentials=true" `
      --output text --query "ApiId" | Out-Null
  }
} finally {
  Pop-Location
}

Write-Host "=== Wall QA desplegado ===" -ForegroundColor Green

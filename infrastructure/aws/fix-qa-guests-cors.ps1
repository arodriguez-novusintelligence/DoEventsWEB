# Habilita CORS en la API HTTP de guests QA (api-qa.doeventsapp.com/guests)
param(
  [string]$Region = "us-east-2",
  [string]$Domain = "api-qa.doeventsapp.com",
  [string]$MappingKey = "guests"
)

$ErrorActionPreference = "Stop"

$apiId = aws apigatewayv2 get-api-mappings --domain-name $Domain --region $Region `
  --query "Items[?ApiMappingKey=='$MappingKey'].ApiId | [0]" --output text

if (-not $apiId -or $apiId -eq "None") {
  throw "No se encontró API mapping '$MappingKey' en $Domain"
}

Write-Host "Habilitando CORS en guests API: $apiId" -ForegroundColor Cyan

aws apigatewayv2 update-api --api-id $apiId --region $Region `
  --cors-configuration "AllowOrigins=https://qa.doeventsapp.com,http://localhost:5173,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,Accept,AllowCredentials=true" `
  --output json --query "CorsConfiguration" | Write-Host

Write-Host "CORS aplicado correctamente." -ForegroundColor Green

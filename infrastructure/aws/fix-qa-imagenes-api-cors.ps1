# Habilita CORS en la API HTTP de imagenes QA (preflight desde qa.doeventsapp.com)
param(
    [string]$Region = "us-east-2",
    [string]$ApiId = "xjtm1laya6"
)

$ErrorActionPreference = "Stop"

Write-Host "Aplicando CORS en API $ApiId ..." -ForegroundColor Cyan
aws apigatewayv2 update-api --api-id $ApiId --region $Region `
    --cors-configuration "AllowOrigins=https://qa.doeventsapp.com,https://doeventsapp.com,http://localhost:5173,http://localhost:4173,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,Accept,AllowCredentials=true" `
    --output text --query "ApiId" | Out-Null

Write-Host "CORS de imagenes QA actualizado." -ForegroundColor Green

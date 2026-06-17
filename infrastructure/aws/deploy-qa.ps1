# DoEventsWEB - Despliegue continuo a https://qa.doeventsapp.com
param(
    [string]$Region = "us-east-2",
    [string]$Bucket = "doevents-web-qa",
    [string]$Domain = "qa.doeventsapp.com",
    [string]$CloudFrontDistributionId = $(if ($env:CLOUDFRONT_DISTRIBUTION_ID) { $env:CLOUDFRONT_DISTRIBUTION_ID } else { "E3UV9NHXADGSAJ" })
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

Write-Host "=== Build QA ===" -ForegroundColor Cyan
npm run build:qa
if ($LASTEXITCODE -ne 0) { throw "Build falló" }

Write-Host "=== Verificar bucket S3: $Bucket ===" -ForegroundColor Cyan
$bucketExists = aws s3 ls "s3://$Bucket" --region $Region 2>$null
if (-not $bucketExists) {
    Write-Host "Creando bucket $Bucket ..."
    aws s3 mb "s3://$Bucket" --region $Region
}

# NOTA: --delete solo elimina assets viejos del build SPA en doevents-web-qa.
# NO toca buckets de multimedia (doevent-venue-images, perfiles, QR, etc.) ni tablas DynamoDB.
# Los datos de usuarios, eventos, lugares e imágenes persisten entre despliegues.
Write-Host "=== Subiendo shell (raíz) ===" -ForegroundColor Cyan
aws s3 sync packages/shell/dist/ "s3://$Bucket/" --delete --region $Region `
    --cache-control "public, max-age=0, must-revalidate"

Write-Host "=== Subiendo mfe-auth (/mfe-auth/) ===" -ForegroundColor Cyan
aws s3 sync packages/mfe-auth/dist/ "s3://$Bucket/mfe-auth/" --delete --region $Region `
    --cache-control "public, max-age=0, must-revalidate" `
    --exclude "index.html" `
    --exclude ".dev-server/*" `
    --exclude "@mf-types/*"

aws s3 cp packages/mfe-auth/dist/index.html "s3://$Bucket/mfe-auth/index.html" --region $Region `
    --cache-control "public, max-age=0, must-revalidate"

Write-Host "=== Configurar index.html SPA (shell) ===" -ForegroundColor Cyan
aws s3 cp packages/shell/dist/index.html "s3://$Bucket/index.html" --region $Region `
    --cache-control "public, max-age=0, must-revalidate" `
    --content-type "text/html"

if ($CloudFrontDistributionId) {
    Write-Host "=== Invalidando CloudFront $CloudFrontDistributionId ===" -ForegroundColor Cyan
    aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*"
}

Write-Host ""
Write-Host "=== Despliegue completado ===" -ForegroundColor Green
Write-Host "URL: https://$Domain/auth/login"
Write-Host "Login: https://$Domain/auth/login"

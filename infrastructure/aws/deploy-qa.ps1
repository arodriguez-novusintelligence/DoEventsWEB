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

$EnvFile = Join-Path $Root ".env.qa"
. (Join-Path $PSScriptRoot "load-vite-env.ps1") -EnvFile $EnvFile

if (-not $env:VITE_GOOGLE_MAPS_API_KEY) {
    throw "Falta VITE_GOOGLE_MAPS_API_KEY. Defínela en .env.qa antes del deploy QA."
}

Write-Host "=== Build QA ===" -ForegroundColor Cyan
if ($env:VITE_GOOGLE_MAPS_API_KEY) {
    $prefix = $env:VITE_GOOGLE_MAPS_API_KEY.Substring(0, [Math]::Min(8, $env:VITE_GOOGLE_MAPS_API_KEY.Length))
    Write-Host "Google Maps key present: ${prefix}..." -ForegroundColor DarkGray
}
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
Write-Host "=== Subiendo shell (assets con cache largo) ===" -ForegroundColor Cyan
aws s3 sync packages/shell/dist/assets/ "s3://$Bucket/assets/" --delete --region $Region `
    --cache-control "public, max-age=31536000, immutable"

Write-Host "=== Subiendo shell (JS/CSS raiz con hash) ===" -ForegroundColor Cyan
Get-ChildItem packages/shell/dist -File | Where-Object { $_.Extension -match '\.(js|css)$' } | ForEach-Object {
  aws s3 cp $_.FullName "s3://$Bucket/$($_.Name)" --region $Region `
    --cache-control "public, max-age=31536000, immutable"
}

Write-Host "=== Subiendo shell (otros estaticos) ===" -ForegroundColor Cyan
aws s3 sync packages/shell/dist/ "s3://$Bucket/" --delete --region $Region `
    --exclude "index.html" `
    --exclude "assets/*" `
    --exclude "*.js" `
    --exclude "*.css" `
    --cache-control "public, max-age=86400"

Write-Host "=== Subiendo mfe-auth (assets) ===" -ForegroundColor Cyan
aws s3 sync packages/mfe-auth/dist/assets/ "s3://$Bucket/mfe-auth/assets/" --delete --region $Region `
    --cache-control "public, max-age=31536000, immutable" `
    --exclude "@mf-types/*"

Get-ChildItem packages/mfe-auth/dist -File | Where-Object { $_.Extension -match '\.(js|css)$' } | ForEach-Object {
  aws s3 cp $_.FullName "s3://$Bucket/mfe-auth/$($_.Name)" --region $Region `
    --cache-control "public, max-age=31536000, immutable"
}

aws s3 sync packages/mfe-auth/dist/ "s3://$Bucket/mfe-auth/" --delete --region $Region `
    --exclude "index.html" `
    --exclude "assets/*" `
    --exclude "*.js" `
    --exclude "*.css" `
    --exclude ".dev-server/*" `
    --exclude "@mf-types/*" `
    --cache-control "public, max-age=86400"

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

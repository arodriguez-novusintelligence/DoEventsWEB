# Crea y configura bucket S3 QA para fotos de perfil y portada (us-east-2)
param(
    [string]$Region = "us-east-2",
    [string]$Bucket = "doevents-profile-media-qa",
    [string[]]$Origins = @(
        "https://qa.doeventsapp.com",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173"
    )
)

$ErrorActionPreference = "Stop"

Write-Host "=== Bucket perfil QA: $Bucket ($Region) ===" -ForegroundColor Cyan

$bucketExists = $false
try {
  aws s3api head-bucket --bucket $Bucket --region $Region 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $bucketExists = $true }
} catch {
  $bucketExists = $false
}

if (-not $bucketExists) {
    Write-Host "Creando bucket..."
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $Bucket --region $Region | Out-Null
    } else {
        aws s3api create-bucket --bucket $Bucket --region $Region `
            --create-bucket-configuration "LocationConstraint=$Region" | Out-Null
    }
    if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el bucket" }
    Write-Host "Bucket creado." -ForegroundColor Green
} else {
    Write-Host "Bucket ya existe." -ForegroundColor Yellow
}

$corsPath = Join-Path $PSScriptRoot "tmp-profile-qa-bucket-cors.json"
$cors = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "PUT", "POST", "HEAD")
            AllowedOrigins = $Origins
            ExposeHeaders = @("ETag")
            MaxAgeSeconds = 3600
        }
    )
} | ConvertTo-Json -Depth 5

[System.IO.File]::WriteAllText($corsPath, $cors, (New-Object System.Text.UTF8Encoding $false))
aws s3api put-bucket-cors --bucket $Bucket --region $Region --cors-configuration "file://$($corsPath -replace '\\','/')"
if ($LASTEXITCODE -ne 0) { throw "put-bucket-cors fallo" }

Write-Host "CORS aplicado para: $($Origins -join ', ')" -ForegroundColor Green
Write-Host "Listo. Usar PROFILE_BUCKET=$Bucket y PROFILE_BUCKET_REGION=$Region en lambdas QA." -ForegroundColor Green

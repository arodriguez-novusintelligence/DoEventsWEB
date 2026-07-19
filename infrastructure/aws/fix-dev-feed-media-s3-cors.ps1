# CORS del bucket de media del feed (historias/publicaciones) — DEV sa-east-1
param(
    [string]$Bucket = "aws-lambda-wall-social-media-dev-media-519010577666",
    [string]$Region = "sa-east-1",
    [string[]]$Origins = @(
        "https://dev.doeventsapp.com",
        "https://qa.doeventsapp.com",
        "https://doeventsapp.com",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173"
    )
)

$ErrorActionPreference = "Stop"
$corsPath = Join-Path $PSScriptRoot "tmp-feed-media-bucket-cors.json"

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

Write-Host "Aplicando CORS en s3://$Bucket ($Region) ..." -ForegroundColor Cyan
aws s3api put-bucket-cors --bucket $Bucket --region $Region --cors-configuration "file://$($corsPath -replace '\\','/')"
if ($LASTEXITCODE -ne 0) { throw "put-bucket-cors fallo" }

Write-Host "CORS actualizado para: $($Origins -join ', ')" -ForegroundColor Green

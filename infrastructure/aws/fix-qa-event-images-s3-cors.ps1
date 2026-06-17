# CORS del bucket de imagenes de eventos para subidas directas desde el navegador (QA + local)
param(
    [string]$Bucket = "doeventimageeventbucket",
    [string[]]$Origins = @(
        "https://qa.doeventsapp.com",
        "https://doeventsapp.com",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173"
    )
)

$ErrorActionPreference = "Stop"
$corsPath = Join-Path $PSScriptRoot "tmp-event-images-bucket-cors.json"

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

Write-Host "Aplicando CORS en s3://$Bucket ..." -ForegroundColor Cyan
aws s3api put-bucket-cors --bucket $Bucket --cors-configuration "file://$($corsPath -replace '\\','/')"
if ($LASTEXITCODE -ne 0) { throw "put-bucket-cors fallo" }

Write-Host "CORS actualizado para: $($Origins -join ', ')" -ForegroundColor Green

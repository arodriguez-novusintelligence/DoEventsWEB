# CORS en bucket S3 de medios de chat (subida directa desde el navegador)
param(
  [string]$Bucket = "doeventschatroombucket",
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

$corsPath = Join-Path $env:TEMP "chat-s3-cors.json"
$corsJson = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","HEAD"],"AllowedOrigins":["https://qa.doeventsapp.com","https://doeventsapp.com","http://localhost:5173","http://localhost:4173"],"ExposeHeaders":["ETag","x-amz-request-id"],"MaxAgeSeconds":3600}]}'
[System.IO.File]::WriteAllText($corsPath, $corsJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Aplicando CORS en s3://$Bucket ($Region)..." -ForegroundColor Cyan
aws s3api put-bucket-cors --bucket $Bucket --region $Region --cors-configuration "file://$corsPath"
aws s3api get-bucket-cors --bucket $Bucket --region $Region
Write-Host "CORS del bucket de chat configurado." -ForegroundColor Green

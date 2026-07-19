# CORS en bucket S3 de medios de chat (subida directa desde el navegador)
param(
  [string]$Bucket = "doeventschatroombucket",
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

$corsPath = Join-Path $env:TEMP "chat-s3-cors.json"
$corsJson = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedOrigins":["https://dev.doeventsapp.com","https://qa.doeventsapp.com","https://doeventsapp.com","http://localhost:5173","http://localhost:4173","http://127.0.0.1:5173","https://localhost","capacitor://localhost"],"ExposeHeaders":["ETag","x-amz-request-id"],"MaxAgeSeconds":3600}]}'
[System.IO.File]::WriteAllText($corsPath, $corsJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Aplicando CORS en s3://$Bucket ($Region)..." -ForegroundColor Cyan
aws s3api put-bucket-cors --bucket $Bucket --region $Region --cors-configuration "file://$corsPath"
aws s3api get-bucket-cors --bucket $Bucket --region $Region
Write-Host "CORS del bucket de chat configurado." -ForegroundColor Green

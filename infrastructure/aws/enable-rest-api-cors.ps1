# Habilita OPTIONS + CORS en recursos REST API Gateway (QA web)
param(
  [string]$Origin = "https://qa.doeventsapp.com"
)

$ErrorActionPreference = "Stop"

function Enable-RestResourceCors {
  param(
    [string]$RestApiId,
    [string]$ResourceId,
    [string]$Region,
    [string[]]$Methods = @("GET", "POST", "OPTIONS")
  )

  Write-Host "CORS -> API $RestApiId resource $ResourceId ($Region)" -ForegroundColor Cyan

  aws apigateway put-method `
    --rest-api-id $RestApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region $Region | Out-Null

  $requestTemplatesPath = Join-Path $env:TEMP "apigw-mock-request-$RestApiId-$ResourceId.json"
  '{"application/json":"{\"statusCode\":200}"}' | Set-Content -Path $requestTemplatesPath -Encoding ASCII -NoNewline

  aws apigateway put-integration `
    --rest-api-id $RestApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates "file://$requestTemplatesPath" `
    --region $Region | Out-Null

  aws apigateway put-method-response `
    --rest-api-id $RestApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true" `
    --region $Region | Out-Null

  $allowMethods = ($Methods -join ",")
  $responseParams = @{
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'$allowMethods'"
    "method.response.header.Access-Control-Allow-Origin" = "'$Origin'"
  } | ConvertTo-Json -Compress
  $responseParamsPath = Join-Path $env:TEMP "apigw-response-params-$RestApiId-$ResourceId.json"
  [System.IO.File]::WriteAllText($responseParamsPath, $responseParams, [System.Text.UTF8Encoding]::new($false))

  aws apigateway put-integration-response `
    --rest-api-id $RestApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "file://$responseParamsPath" `
    --region $Region | Out-Null

  aws apigateway create-deployment `
    --rest-api-id $RestApiId `
    --stage-name qa `
    --region $Region `
    --description "Enable CORS for QA web" | Out-Null
}

# Login API (us-east-1)
Enable-RestResourceCors -RestApiId "o4s2ufc1e8" -ResourceId "hyzhtg" -Region "us-east-1" -Methods @("POST", "OPTIONS")

# Chat API (us-east-2) — recursos usados por la web QA
$chatApi = "jwhi03pib6"
$chatRegion = "us-east-2"
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "4t78i5" -Region $chatRegion -Methods @("GET", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "ue21ag" -Region $chatRegion -Methods @("GET", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "7jv18u" -Region $chatRegion -Methods @("GET", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "8qqki1" -Region $chatRegion -Methods @("POST", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "sdyskt" -Region $chatRegion -Methods @("PUT", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "2je2zp" -Region $chatRegion -Methods @("PUT", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "gek0hl" -Region $chatRegion -Methods @("POST", "OPTIONS")
Enable-RestResourceCors -RestApiId $chatApi -ResourceId "1wucee" -Region $chatRegion -Methods @("POST", "OPTIONS")

Write-Host "CORS habilitado." -ForegroundColor Green

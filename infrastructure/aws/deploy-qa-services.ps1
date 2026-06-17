# Redeploy manageusers, orders y notifications en QA (us-east-2)
param(
  [string]$Region = "us-east-2",
  [string]$Domain = "api-qa.doeventsapp.com",
  [ValidateSet("all", "login", "users", "orders", "notifications", "guests", "services", "venues", "staff-access", "agentes-ia")]
  [string]$Target = "all",
  [switch]$SkipEnvFix
)

$ErrorActionPreference = "Stop"
$BackRoot = Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))) "DoEventsBack"
$InfraDir = $PSScriptRoot

function Update-ApiMapping($MappingKey, $ApiId, $Stage) {
  $mapping = aws apigatewayv2 get-api-mappings --domain-name $Domain --region $Region `
    --query "Items[?ApiMappingKey=='$MappingKey'] | [0]" --output json | ConvertFrom-Json
  if (-not $mapping.ApiMappingId) {
    Write-Host "Creando mapping '$MappingKey' -> $ApiId ($Stage)" -ForegroundColor Yellow
    aws apigatewayv2 create-api-mapping --domain-name $Domain --region $Region `
      --api-id $ApiId --stage $Stage --api-mapping-key $MappingKey | Out-Null
    return
  }
  Write-Host "Actualizando mapping '$MappingKey' ($($mapping.ApiMappingId)) -> $ApiId ($Stage)" -ForegroundColor Yellow
  aws apigatewayv2 update-api-mapping --domain-name $Domain --region $Region `
    --api-mapping-id $mapping.ApiMappingId --api-id $ApiId --stage $Stage | Out-Null
}

function Enable-HttpApiCors($ApiId) {
  aws apigatewayv2 update-api --api-id $ApiId --region $Region `
    --cors-configuration "AllowOrigins=https://qa.doeventsapp.com,http://localhost:5173,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,Accept,AllowCredentials=true" `
    --output text --query "ApiId" | Out-Null
}

function Get-StackApiId($StackName, $ResourceType) {
  aws cloudformation describe-stack-resources --stack-name $StackName --region $Region `
    --query "StackResources[?ResourceType=='$ResourceType'].PhysicalResourceId | [0]" --output text
}

function Deploy-QaService {
  param(
    [string]$Label,
    [string]$RelativePath,
    [string]$ConfigFile = "serverless.qa.yml",
    [string]$StackName,
    [string]$HttpMappingKey,
    [string]$HttpMappingStage = '$default',
    [string[]]$ExtraMappingKeys = @(),
    [string]$ApiResourceType = 'AWS::ApiGatewayV2::Api'
  )

  Write-Host "`n=== Desplegando $Label ===" -ForegroundColor Cyan
  $servicePath = Join-Path $BackRoot $RelativePath
  Push-Location $servicePath
  try {
    if (Test-Path ".serverless") {
      Remove-Item ".serverless" -Recurse -Force
    }
    if (Test-Path "package.json") {
      if ($Label -eq "manageusers") {
        npm ci --omit=dev --silent 2>$null
      } else {
        npm install --silent 2>$null
      }
    }
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $out = npx serverless deploy --config $ConfigFile --stage qa --region $Region 2>&1 | Out-String
    } finally {
      $ErrorActionPreference = $prevEap
    }
    Write-Host $out
    if ($LASTEXITCODE -ne 0) { throw "serverless deploy falló para $Label (exit $LASTEXITCODE)" }

    if ($HttpMappingKey) {
      $apiId = Get-StackApiId $StackName $ApiResourceType
      if (-not $apiId -or $apiId -eq "None") {
        $apiId = ($out | Select-String -Pattern 'https://([a-z0-9]+)\.execute-api' -AllMatches).Matches[0].Groups[1].Value
      }
      if ($apiId -and $apiId -ne "None") {
        if ($ApiResourceType -eq 'AWS::ApiGatewayV2::Api') { Enable-HttpApiCors $apiId }
        Update-ApiMapping $HttpMappingKey $apiId $HttpMappingStage
        foreach ($key in $ExtraMappingKeys) {
          Update-ApiMapping $key $apiId $HttpMappingStage
        }
        Write-Host "$Label API: $apiId (mapping: $HttpMappingKey)" -ForegroundColor Green
      } else {
        Write-Warning "No se detectó API ID para $Label (stack: $StackName)"
      }
    }
  } finally {
    Pop-Location
  }
}

if (-not $SkipEnvFix) {
  Write-Host "Corrigiendo env vars e IAM QA (no modifica datos ni buckets de multimedia)..." -ForegroundColor Cyan
  & (Join-Path $InfraDir "fix-qa-lambda-env.ps1") -Region $Region
  & (Join-Path $InfraDir "fix-qa-lambda-iam.ps1") -Region $Region
}

if ($Target -eq "all" -or $Target -eq "login") {
  Deploy-QaService -Label "login" -RelativePath "aws-lambda-login" `
    -StackName "aws-lambda-login-qa" -HttpMappingKey "login"
}

if ($Target -eq "all" -or $Target -eq "users") {
  Deploy-QaService -Label "manageusers" -RelativePath "aws-lamda-manageusers" `
    -StackName "aws-lambda-manageusers-qa" -HttpMappingKey "users"
}

if ($Target -eq "all" -or $Target -eq "orders") {
  Deploy-QaService -Label "orders-manageTickets" -RelativePath "aws-lambda-orders-manageTickets" `
    -StackName "aws-lambda-orders-manageTickets-qa" -HttpMappingKey "orders" -HttpMappingStage "qa" `
    -ExtraMappingKeys @("tickets-mgmt") -ApiResourceType "AWS::ApiGateway::RestApi"
}

if ($Target -eq "all" -or $Target -eq "notifications") {
  Deploy-QaService -Label "notifications" -RelativePath "aws-lambda-notifications" `
    -StackName "notifications-qa" -HttpMappingKey "notifications" -HttpMappingStage "qa" `
    -ApiResourceType "AWS::ApiGateway::RestApi"
}

if ($Target -eq "all" -or $Target -eq "guests") {
  Deploy-QaService -Label "guests" -RelativePath "aws-lambda-guests" `
    -StackName "aws-lambda-guests-qa" -HttpMappingKey "guests"
}

if ($Target -eq "all" -or $Target -eq "services") {
  Deploy-QaService -Label "services" -RelativePath "aws-lambda-services" `
    -StackName "aws-lambda-services-qa" -HttpMappingKey "services"
}

if ($Target -eq "all" -or $Target -eq "venues") {
  Deploy-QaService -Label "venues" -RelativePath "aws-lambda-venues" `
    -ConfigFile "serverless.yml" -StackName "aws-lambda-venues-qa" -HttpMappingKey "venues" -HttpMappingStage "qa" `
    -ApiResourceType "AWS::ApiGateway::RestApi"
}

if ($Target -eq "all" -or $Target -eq "staff-access") {
  Write-Host "`n=== Compilando staff-access ===" -ForegroundColor Cyan
  $staffPath = Join-Path $BackRoot "aws-lambda-staff-access"
  Push-Location $staffPath
  try {
    npm install --silent 2>$null
    npm run build 2>&1 | Out-String | Write-Host
  } finally {
    Pop-Location
  }
  Deploy-QaService -Label "staff-access" -RelativePath "aws-lambda-staff-access" `
    -StackName "staff-access-qa" -HttpMappingKey "staff-access" -HttpMappingStage "qa" `
    -ApiResourceType "AWS::ApiGateway::RestApi"
}

if ($Target -eq "all" -or $Target -eq "agentes-ia") {
  Deploy-QaService -Label "agentes-ia" -RelativePath "AgentesIA" `
    -StackName "doevents-agentes-ia-qa" -HttpMappingKey "ai"
}

Write-Host "`n=== Redeploy QA completado ===" -ForegroundColor Green

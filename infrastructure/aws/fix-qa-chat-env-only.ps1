# Restaura env vars QA solo en lambdas chat-room-events (us-east-2)
param([string]$Region = "us-east-2")

$ErrorActionPreference = "Stop"

$chatEnv = @{
  CHATS_TABLE = "Chats-qa"
  EVENTOS_TABLE = "Eventos-qa"
  IMAGENES_TABLE = "imagenes-qa"
  CLIENT_TABLE = "Client-qa"
  CHAT_IDEMPOTENCY_TABLE = "ChatMessageIdempotency-qa"
  MESSAGES_TABLE = "ChatMessage-qa"
  USER_CHANNELS_TABLE = "UserChannels-qa"
  DYNAMODB_REGION = "us-east-2"
  STAGE = "qa"
  API_PUBLIC_BASE_URL = "https://api-qa.doeventsapp.com"
  WS_API_ENDPOINT = "wss://zjg66jel41.execute-api.us-east-2.amazonaws.com/qa"
}

function Update-LambdaEnv($FunctionName, $Vars) {
  $current = aws lambda get-function-configuration --function-name $FunctionName --region $Region --query "Environment.Variables" --output json 2>$null
  $merged = @{}
  if ($current -and $current -ne "null") {
    ($current | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $merged[$_.Name] = $_.Value }
  }
  $Vars.GetEnumerator() | ForEach-Object { $merged[$_.Key] = $_.Value }
  $envObj = @{ Variables = $merged }
  $envJson = $envObj | ConvertTo-Json -Compress -Depth 5
  $envFile = Join-Path $env:TEMP "lambda-env-$FunctionName.json"
  [System.IO.File]::WriteAllText($envFile, $envJson, [System.Text.UTF8Encoding]::new($false))
  Write-Host "  -> $FunctionName"
  aws lambda update-function-configuration --function-name $FunctionName --region $Region --environment "file://$envFile" --output text --query "FunctionName" | Out-Null
}

Write-Host "=== chat-room-events ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'chat-room-events-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $chatEnv } }

Write-Host "=== Listo ===" -ForegroundColor Green

# Usuarios de prueba QA para flujo login / gustos / perfil
param([string]$Region = "us-east-2")

$ErrorActionPreference = "Stop"
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

function Put-DynamoItem($TableName, $Item) {
  $file = Join-Path $env:TEMP "dynamo-seed-$TableName-$([Guid]::NewGuid().ToString('N')).json"
  $json = $Item | ConvertTo-Json -Depth 6 -Compress
  [System.IO.File]::WriteAllText($file, $json, [System.Text.UTF8Encoding]::new($false))
  aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($file -replace '\\','/')" | Out-Null
  Remove-Item $file -ErrorAction SilentlyContinue
}

function Put-Client($Id, $Email, $User, $Name, $LastName, $Phone, $Password, $Status) {
  Put-DynamoItem "Client-qa" @{
    id = @{ S = $Id }
    email = @{ S = $Email }
    user = @{ S = $User }
    name = @{ S = $Name }
    lastName = @{ S = $LastName }
    phone = @{ S = $Phone }
    password = @{ S = $Password }
    userStatus = @{ S = $Status }
    createDate = @{ S = $now }
    indicativo = @{ S = "+57" }
    fotoPerfilUrl = @{ S = "fotosPerfil/default.jpg" }
    plan = @{ S = "free" }
    isPublicProfile = @{ BOOL = $true }
    calificacion = @{ N = "0" }
    eventosRealizados = @{ N = "0" }
    experiencia = @{ N = "0" }
  }
  Write-Host "  Client-qa: $Email ($Id)" -ForegroundColor Green
}

function Put-UserPreferences($UserId, [int[]]$Prefs) {
  $prefList = @($Prefs | ForEach-Object { @{ N = "$_" } })
  Put-DynamoItem "UserPreferences-qa" @{
    UserId = @{ S = $UserId }
    Preferences = @{ L = $prefList }
    createdAt = @{ S = $now }
    updatedAt = @{ S = $now }
  }
  Write-Host "  UserPreferences-qa: $UserId" -ForegroundColor Green
}

Write-Host "=== Sembrando usuarios QA ===" -ForegroundColor Cyan

Put-Client `
  -Id "qa-gust-01" `
  -Email "qa-gustos@doeventsapp.com" `
  -User "qa_gustos" `
  -Name "Usuario" `
  -LastName "Gustos QA" `
  -Phone "+573001110001" `
  -Password "QaTest123!" `
  -Status "active"

Put-Client `
  -Id "qa-full-01" `
  -Email "qa-full@doeventsapp.com" `
  -User "qa_full" `
  -Name "Tatiana" `
  -LastName "Completo QA" `
  -Phone "+573001110002" `
  -Password "QaTest123!" `
  -Status "active"

Put-Client `
  -Id "qa-inactive-01" `
  -Email "qa-inactive@doeventsapp.com" `
  -User "qa_inactive" `
  -Name "Usuario" `
  -LastName "Inactivo QA" `
  -Phone "+573001110003" `
  -Password "QaTest123!" `
  -Status "pending"

Put-UserPreferences -UserId "qa-full-01" -Prefs @(1001, 1005, 1010)

# Resetear gustos de qa-gustos para pruebas repetibles (eliminar si existe)
aws dynamodb delete-item `
  --table-name "UserPreferences-qa" `
  --region $Region `
  --key '{\"UserId\":{\"S\":\"qa-gust-01\"}}' 2>$null | Out-Null
Write-Host "  UserPreferences-qa: qa-gust-01 reseteado (si existía)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  Gustos (sin preferencias): qa-gustos@doeventsapp.com / QaTest123!"
Write-Host "  Flujo completo (con gustos): qa-full@doeventsapp.com / QaTest123!"
Write-Host "  OTP pendiente (inactivo):   qa-inactive@doeventsapp.com / QaTest123!"
Write-Host ""
Write-Host "Ejecutar pruebas: .\infrastructure\aws\test-qa-flows.ps1" -ForegroundColor Cyan

# Pruebas de integración QA: login, gustos, perfil
param(
  [string]$ApiBase = "https://api-qa.doeventsapp.com",
  [string]$Region = "us-east-2"
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Step($Name, $ScriptBlock) {
  Write-Host "`n[$Name]" -ForegroundColor Cyan
  try {
    & $ScriptBlock
    Write-Host "  OK" -ForegroundColor Green
    $script:passed++
  } catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $script:failed++
  }
}

function Invoke-Api($Method, $Path, $Body = $null) {
  $uri = "$ApiBase$Path"
  $params = @{
    Uri = $uri
    Method = $Method
    ContentType = "application/json"
    ErrorAction = "Stop"
  }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress) }
  return Invoke-RestMethod @params
}

Write-Host "=== Pruebas QA DoEvents ===" -ForegroundColor Yellow
Write-Host "API: $ApiBase"

Test-Step "Reset preferencias qa-gustos" {
  aws dynamodb delete-item `
    --table-name "UserPreferences-qa" `
    --region $Region `
    --key '{\"UserId\":{\"S\":\"qa-gust-01\"}}' 2>$null | Out-Null
  Write-Host "  qa-gust-01 sin preferencias"
}

Test-Step "GET preferencias" {
  $res = Invoke-Api GET "/auth/preference"
  if (-not $res.success) { throw "success=false" }
  if (-not $res.data -or $res.data.Count -lt 1) { throw "sin preferencias en catálogo" }
  Write-Host "  $($res.data.Count) preferencias disponibles"
}

Test-Step "Login qa-full (con gustos) -> token" {
  $res = Invoke-Api POST "/login/login" @{ email = "qa-full@doeventsapp.com"; password = "QaTest123!" }
  if (-not $res.success) { throw $res.message }
  if (-not $res.data.token) { throw "sin token" }
  $script:fullToken = $res.data.token
  $script:fullUserId = $res.data.user.userId
  Write-Host "  userId=$($script:fullUserId)"
}

Test-Step "Login qa-gustos (sin gustos) -> codigo 3" {
  try {
    Invoke-Api POST "/login/login" @{ email = "qa-gustos@doeventsapp.com"; password = "QaTest123!" } | Out-Null
    throw "debería devolver error codigo 3"
  } catch {
    $raw = $_.ErrorDetails.Message
    if (-not $raw) { throw "sin cuerpo de error (¿ya tiene gustos guardados?)" }
    $err = $raw | ConvertFrom-Json
    if ($err.data.codigoRespuesta -ne 3) { throw "codigo=$($err.data.codigoRespuesta)" }
    $script:gustosUserId = $err.data.userId
    Write-Host "  userId=$($script:gustosUserId)"
  }
}

Test-Step "GET perfil qa-full" {
  $res = Invoke-RestMethod -Uri "$ApiBase/users/getUser/$($script:fullUserId)" -Method GET
  $email = $res.email
  if (-not $email -and $res.data) { $email = $res.data.email }
  if (-not $email) { throw "sin email en perfil" }
  Write-Host "  $email / $($res.name) $($res.lastName)"
}

Test-Step "POST guardar gustos qa-gustos" {
  $res = Invoke-Api POST "/auth/userPreference" @{
    userId = $script:gustosUserId
    preferences = @(1001, 1002)
    createEvents = "No"
    provideServices = "No"
    havePlace = "No"
  }
  if (-not $res.success) { throw $res.message }
}

Test-Step "Login qa-gustos tras guardar gustos -> token" {
  $res = Invoke-Api POST "/login/login" @{ email = "qa-gustos@doeventsapp.com"; password = "QaTest123!" }
  if (-not $res.success) { throw $res.message }
  if (-not $res.data.token) { throw "sin token tras completar gustos" }
  Write-Host "  login exitoso"
}

Test-Step "GET eventos del usuario qa-full" {
  $res = Invoke-RestMethod -Uri "$ApiBase/events/getUserEvents/$($script:fullUserId)" -Method GET
  $count = 0
  if ($res.data.datosEvento) { $count = $res.data.datosEvento.Count }
  Write-Host "  $count eventos"
}

Test-Step "Login inactivo -> codigo 2 (OTP)" {
  try {
    Invoke-Api POST "/login/login" @{ email = "qa-inactive@doeventsapp.com"; password = "QaTest123!" } | Out-Null
    throw "debería fallar por OTP"
  } catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($err.data.codigoRespuesta -ne 2) { throw "codigo=$($err.data.codigoRespuesta)" }
    Write-Host "  redirige a verificación OTP"
  }
}

Test-Step "Credenciales inválidas -> codigo 1" {
  try {
    Invoke-Api POST "/login/login" @{ email = "qa-full@doeventsapp.com"; password = "wrong" } | Out-Null
    throw "debería fallar"
  } catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($err.data.codigoRespuesta -ne 1) { throw "codigo=$($err.data.codigoRespuesta)" }
  }
}

$script:qaToken = $null
Test-Step "GET muro social /wall/v1/feed/home" {
  $login = Invoke-Api POST "/login/login" @{ email = "qa-full@doeventsapp.com"; password = "QaTest123!" }
  $script:qaToken = $login.data.token
  $headers = @{ Authorization = $script:qaToken }
  $feed = Invoke-RestMethod -Uri "$ApiBase/wall/v1/feed/home?limit=5" -Headers $headers
  if (-not $feed.items) { throw "sin items en feed social" }
  Write-Host "  $($feed.items.Count) publicaciones"
}

Test-Step "POST publicación en muro social" {
  if (-not $script:qaToken) { throw "sin token" }
  $body = @{
    type = "post"
    title = "QA automated"
    description = "Publicación de prueba DoEventsWEB"
    visibility = "PUBLIC"
    clientRequestId = "qa-test-$(Get-Random)"
  } | ConvertTo-Json -Compress
  $pub = Invoke-RestMethod -Uri "$ApiBase/wall/v1/feed/publications" -Method POST -Headers @{ Authorization = $script:qaToken; "Content-Type" = "application/json" } -Body $body
  if (-not $pub.publication.id) { throw "sin publication id" }
  Write-Host "  id=$($pub.publication.id)"
}

Test-Step "GET boletas disponibles evento TROPIPOP" {
  $eventId = "2fb84fcd-1a4c-4ae0-b571-c6452a5f0767"
  $seats = Invoke-RestMethod -Uri "$ApiBase/orders/events/$eventId/available-seats"
  if (-not $seats.categories -or $seats.categories.Count -lt 1) { throw "sin categorías" }
  Write-Host "  $($seats.categories.Count) categorías"
}

Write-Host "`n=== Resumen ===" -ForegroundColor Yellow
Write-Host "Pasaron: $passed" -ForegroundColor Green
Write-Host "Fallaron: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -gt 0) { exit 1 }
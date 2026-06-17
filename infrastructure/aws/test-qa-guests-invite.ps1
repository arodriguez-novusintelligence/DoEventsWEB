# Prueba API: contactos, invitados de evento e invitaciones (QA)
param(
  [string]$ApiBase = "https://api-qa.doeventsapp.com"
)

$ErrorActionPreference = "Stop"

function Invoke-GuestApi($Method, $Path, $Token, $Body = $null) {
  $params = @{
    Uri = "$ApiBase$Path"
    Method = $Method
    Headers = @{
      Authorization = $Token
      Accept = "application/json"
      "Content-Type" = "application/json"
    }
    ErrorAction = "Stop"
  }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress -Depth 6) }
  return Invoke-RestMethod @params
}

Write-Host "=== Login QA ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$ApiBase/login/login" -Method POST -ContentType "application/json" `
  -Body (@{ email = "qa-full@doeventsapp.com"; password = "QaTest123!" } | ConvertTo-Json)
if (-not $login.success) { throw "Login falló: $($login.message)" }
$token = $login.data.token
$userId = $login.data.user.userId
Write-Host "OK userId=$userId"

Write-Host "`n=== Eventos del usuario ===" -ForegroundColor Cyan
$eventsRes = Invoke-RestMethod -Uri "$ApiBase/events/getUserEvents/$userId" -Method GET `
  -Headers @{ Authorization = $token; Accept = "application/json" }
$events = @()
if ($eventsRes.data.datosEvento) { $events = $eventsRes.data.datosEvento }
if (-not $events.Count) { throw "El usuario no tiene eventos para probar invitaciones" }
$eventId = [string](if ($events[0].id) { $events[0].id } else { $events[0].idEvento })
Write-Host "OK evento=$eventId ($($events[0].nombre))"

Write-Host "`n=== Contactos favoritos ===" -ForegroundColor Cyan
$favorites = Invoke-GuestApi GET "/guests/users/$userId/favorites" $token
$beforeFav = @($favorites.favorites).Count
Write-Host "OK contactos=$beforeFav"

Write-Host "`n=== Agregar contacto manual ===" -ForegroundColor Cyan
$suffix = Get-Date -Format "HHmmss"
$manual = Invoke-GuestApi POST "/guests/users/$userId/contacts" $token @{
  name = "Test"
  lastName = "Invitado$suffix"
  email = "test.invitado$suffix@example.com"
  phoneIndicative = "+57"
  phoneNumber = "3001234567"
  isFavorite = $false
}
$favoriteId = $manual.favoriteId
if (-not $favoriteId) { throw "No se devolvió favoriteId al agregar contacto" }
Write-Host "OK favoriteId=$favoriteId"

Write-Host "`n=== Invitados del evento (antes) ===" -ForegroundColor Cyan
$guestsBefore = Invoke-GuestApi GET "/guests/events/$eventId/guests" $token
$countBefore = @($guestsBefore.guests).Count
Write-Host "OK invitados evento=$countBefore"

Write-Host "`n=== Agregar invitado al evento ===" -ForegroundColor Cyan
$added = Invoke-GuestApi POST "/guests/events/$eventId/guests" $token @{
  name = "Test Invitado$suffix"
  email = "test.invitado$suffix@example.com"
}
$guestId = $added.guestId
if (-not $guestId) { throw "No se devolvió guestId" }
Write-Host "OK guestId=$guestId"

Write-Host "`n=== Invitados del evento (después) ===" -ForegroundColor Cyan
$guestsAfter = Invoke-GuestApi GET "/guests/events/$eventId/guests" $token
$countAfter = @($guestsAfter.guests).Count
if ($countAfter -le $countBefore) { throw "El listado de invitados del evento no aumentó ($countBefore -> $countAfter)" }
Write-Host "OK invitados evento=$countAfter"

Write-Host "`n=== Enviar invitación ===" -ForegroundColor Cyan
$invite = Invoke-GuestApi POST "/guests/events/$eventId/invitations" $token @{
  invitedBy = $userId
  favoriteIds = @($favoriteId)
  channels = @("email", "inApp", "push")
  message = "Prueba automatizada invitación"
}
$sent = if ($invite.sent) { $invite.sent } elseif ($invite.totalInvitations) { $invite.totalInvitations } else { 0 }
if ($sent -lt 1) { throw "No se envió ninguna invitación (sent=$sent)" }
Write-Host "OK invitaciones enviadas=$sent"

Write-Host "`n=== Invitaciones del evento ===" -ForegroundColor Cyan
$invitations = Invoke-GuestApi GET "/guests/events/$eventId/invitations" $token
$invCount = @($invitations.invitations).Count
if ($invCount -lt 1) { throw "No hay invitaciones registradas en el evento" }
Write-Host "OK invitaciones registradas=$invCount"

Write-Host "`n=== PRUEBA API INVITADOS: PASO ===" -ForegroundColor Green

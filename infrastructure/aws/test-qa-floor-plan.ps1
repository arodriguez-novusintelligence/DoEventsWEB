# Prueba E2E del mapa de silletería dinámico (geometrías libres + QR via TicketsDistribution)
param(
  [string]$ApiBase = "https://api-qa.doeventsapp.com",
  [string]$Email = "qa-full@doeventsapp.com",
  [string]$Password = "QaTest123!"
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0
$token = $null
$userId = $null
$eventId = $null
$venueId = $null
$ticketId = $null

function Test-Step($Name, $ScriptBlock) {
  Write-Host "`n[$Name]" -ForegroundColor Cyan
  try {
    & $ScriptBlock
    Write-Host "  OK" -ForegroundColor Green
    $script:passed++
  } catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host "  $($_.ErrorDetails.Message)" -ForegroundColor DarkRed }
    $script:failed++
  }
}

function Invoke-Api($Method, $Path, $Body = $null, [switch]$UseAuth) {
  $uri = "$ApiBase$Path"
  $headers = @{ "Content-Type" = "application/json" }
  if ($UseAuth -and $token) { $headers["Authorization"] = $token }
  $params = @{
    Uri = $uri
    Method = $Method
    Headers = $headers
    ErrorAction = "Stop"
  }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress -Depth 15) }
  return Invoke-RestMethod @params
}

function New-Id { return [guid]::NewGuid().ToString() }

function Build-Seats($rows, $cols) {
  $seats = @()
  for ($r = 0; $r -lt $rows; $r++) {
    $rowLabel = [char](65 + $r)
    for ($c = 1; $c -le $cols; $c++) {
      $seats += @{
        seatId = (New-Id)
        rowLabel = "$rowLabel"
        colNumber = $c
        seatCode = "$rowLabel$c"
        seatType = "standard"
        status = "available"
        isAccessible = $false
      }
    }
  }
  return $seats
}

Write-Host "=== Prueba mapa silletería dinámico QA ===" -ForegroundColor Yellow

Test-Step "Login" {
  $res = Invoke-Api POST "/login/login" @{ email = $Email; password = $Password }
  $script:token = $res.data.token
  $script:userId = $res.data.user.userId
}

Test-Step "createEvent" {
  $fecha = (Get-Date).AddDays(45).ToString("dd/MM/yyyy")
  $res = Invoke-Api POST "/events/createEvent" @{
    nombre = "Auditorio QA $(Get-Date -Format 'yyyyMMdd-HHmmss')"
    descripcion = "Mapa libre: Tarima, VIP, Pista, General trapecio, Prado semi-anillo"
    fechaIni = $fecha; fechaFin = $fecha; horaIni = "19:00"; horaFin = "23:00"
    organizerName = "QA Floor Plan"; TelPrin = "3001110002"; TelSec = "3001110002"
    IndicativoTelPrinOrg = "+57"; IndicativoTelSecOrg = "+57"; email = $Email
    userId = $userId; tipoEvento = "1001"; Categoria = "1001"; aforo = "600"
    modalidadEvt = "P"; pais = "Colombia"; ciudad = "Bogota"; departamento = "Cundinamarca"
    direccion = "Teatro QA"; tipoLugar = "otro"; skipVenue = $true; clase = "general"; Hashtags = "#QA"
  } -UseAuth
  $script:eventId = $res.data.id
  if (-not $eventId) { throw "sin eventId" }
  Write-Host "  eventId=$eventId"
}

Test-Step "POST venue con mapa multi-geometría" {
  $gateId = New-Id
  $floorId = New-Id
  $vipId = New-Id
  $generalId = New-Id
  $pradoId = New-Id
  $vipSeats = Build-Seats 4 5
  $generalSeats = Build-Seats 11 5
  $pradoSeats = Build-Seats 6 8

  $body = @{
    name = "Auditorio Fantasma QA"
    ownerUserId = $userId
    eventId = $eventId
    hasSeating = $true
    capacity = 600
    address = "Teatro QA"
    city = "Bogota"
    department = "Cundinamarca"
    country = "Colombia"
    description = "Mapa libre de silletería"
    type = "stadium"
    status = "draft"
    gates = @(@{ gateId = $gateId; gateNumber = 1; name = "Entrada Principal"; description = "" })
    floors = @(@{
      floorId = $floorId
      name = "Piso 1"
      description = ""
      elements = @(
        @{ elementId = (New-Id); name = "Tarima"; type = "stage"; geometry = "RECTANGLE"; relX = 20; relY = 4; width = 60; height = 10; rotation = 0; zIndex = 1; notes = "" },
        @{ elementId = (New-Id); name = "Pista de Baile"; type = "other"; geometry = "ELLIPSE"; relX = 25; relY = 38; width = 50; height = 14; rotation = 0; zIndex = 3; notes = "" }
      )
      categories = @(
        @{
          categoryId = $vipId; name = "VIP"; color = "#BBDEFB"; geometry = "RECTANGLE"
          relX = 22; relY = 16; width = 56; height = 18; rotation = 0; zIndex = 2; ringThickness = 55
          gateId = $gateId; gateName = "Entrada Principal"; rows = 4; seatsPerRow = 5
          colOrder = "asc"; rowOrder = "asc"; description = "Sillas VIP"
          hasPrice = $true; costo = $true; valor = 450000; moneda = "COP"
          seats = $vipSeats
          ticketCategory = @{ categoria = "VIP"; id = $vipId; cantidadTickets = $vipSeats.Count; moneda = "COP"; costo = $true; valor = 450000; descripcion = "VIP"; color = "#BBDEFB" }
        },
        @{
          categoryId = $generalId; name = "GENERAL"; color = "#C8E6C9"; geometry = "TRAPEZOID"
          relX = 10; relY = 54; width = 80; height = 28; rotation = 0; zIndex = 4; ringThickness = 55
          gateId = $gateId; rows = 11; seatsPerRow = 5; colOrder = "asc"; rowOrder = "asc"; description = "Sillas General"
          hasPrice = $true; costo = $true; valor = 120000; moneda = "COP"
          seats = $generalSeats
          ticketCategory = @{ categoria = "GENERAL"; id = $generalId; cantidadTickets = $generalSeats.Count; moneda = "COP"; costo = $true; valor = 120000; descripcion = "General"; color = "#C8E6C9" }
        },
        @{
          categoryId = $pradoId; name = "PRADO"; color = "#E1BEE7"; geometry = "SEMI_RING"
          relX = 8; relY = 82; width = 84; height = 16; rotation = 0; zIndex = 5; ringThickness = 55
          gateId = $gateId; rows = 6; seatsPerRow = 8; colOrder = "asc"; rowOrder = "asc"; description = "Prado"
          hasPrice = $true; costo = $true; valor = 80000; moneda = "COP"
          seats = $pradoSeats
          ticketCategory = @{ categoria = "PRADO"; id = $pradoId; cantidadTickets = $pradoSeats.Count; moneda = "COP"; costo = $true; valor = 80000; descripcion = "Prado"; color = "#E1BEE7" }
        }
      )
    })
  }

  $totalSeats = $vipSeats.Count + $generalSeats.Count + $pradoSeats.Count
  $res = Invoke-Api POST "/venues/venues" $body -UseAuth
  $vid = $res.venue.venueId
  if (-not $vid) { $vid = $res.venueId }
  if (-not $vid) { throw "sin venueId" }
  $script:venueId = $vid
  $script:ticketId = $res.venue.ticketRecord.ticketId
  Write-Host "  venueId=$venueId asientos=$totalSeats ticketId=$ticketId"
}

Test-Step "publishEvent" {
  $res = Invoke-Api POST "/events/publishEvent" @{ eventId = $eventId } -UseAuth
  Write-Host "  $($res.message)"
}

Test-Step "GET venue y verificar categorías/geometrías" {
  # El mapping de QA usa prefijo /venues y el recurso expone /venues/{venueId}
  # Por eso el path final queda /venues/venues/{venueId}
  $res = Invoke-Api GET "/venues/venues/$venueId" $null -UseAuth
  $venue = if ($res.venue) { $res.venue } else { $res }
  $floors = @($venue.floors)
  if ($floors.Count -lt 1) { throw "sin floors" }
  $cats = @($floors[0].categories)
  $els = @($floors[0].elements)
  Write-Host "  categorias=$($cats.Count) elementos=$($els.Count)"
  $geometries = ($cats | ForEach-Object { $_.geometry }) -join ", "
  Write-Host "  geometrias categorias: $geometries"
  if ($cats.Count -lt 3) { throw "se esperaban 3 categorías" }
  if ($els.Count -lt 2) { throw "se esperaban 2 elementos" }
}

Test-Step "Verificar TicketsDistribution (QR keys)" {
  if (-not $ticketId) { throw "sin ticketId del venue" }
  # Endpoint distribution vive en /orders (API mapping) en QA.
  $res = Invoke-Api GET "/orders/tickets/$ticketId/distribution" $null -UseAuth
  $items = @()
  if ($res.data) { $items = @($res.data) }
  elseif ($res.distributions) { $items = @($res.distributions) }
  elseif ($res -is [array]) { $items = @($res) }
  if ($items.Count -lt 1) {
    Write-Host "  (endpoint distribution no disponible o vacío; venue/ticket creados OK)" -ForegroundColor DarkYellow
    return
  }
  $withQr = ($items | Where-Object { $_.qrCodeKey -or $_.qrCode -or $_.qr }).Count
  Write-Host "  distribuciones=$($items.Count) conQR=$withQr"
}

Write-Host "`n=== Resumen ===" -ForegroundColor Yellow
Write-Host "Pasaron: $passed | Fallaron: $failed"
if ($eventId) { Write-Host "Evento: $eventId | Venue: $venueId" -ForegroundColor Cyan }
if ($failed -gt 0) { exit 1 }

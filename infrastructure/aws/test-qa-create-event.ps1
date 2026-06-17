# Prueba E2E del wizard de creación de eventos (mismo flujo que CreateEventPage)
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
$eventTypeId = "1001"

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
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress -Depth 12) }
  return Invoke-RestMethod @params
}

function New-Id { return [guid]::NewGuid().ToString() }

Write-Host "=== Prueba wizard creación de evento QA ===" -ForegroundColor Yellow
Write-Host "API: $ApiBase"

Test-Step "Login usuario de prueba" {
  $res = Invoke-Api POST "/login/login" @{ email = $Email; password = $Password }
  if (-not $res.data.token) { throw "sin token" }
  $script:token = $res.data.token
  $script:userId = $res.data.user.userId
  Write-Host "  userId=$userId"
}

Test-Step "GET tipos de evento" {
  $res = Invoke-Api GET "/event-types/EventTypes" $null -UseAuth
  $types = if ($res.data) { @($res.data) } elseif ($res -is [array]) { $res } else { @() }
  if ($types.Count -lt 1) { throw "sin tipos de evento (respuesta: $($res | ConvertTo-Json -Compress -Depth 2))" }
  $script:eventTypeId = $types[0].id
  Write-Host "  tipos=$($types.Count) primero=$eventTypeId ($($types[0].EventType_ES))"
}

Test-Step "POST createEvent (paso 1 wizard)" {
  $fecha = (Get-Date).AddDays(30).ToString("dd/MM/yyyy")
  $body = @{
    nombre = "Evento QA Wizard $(Get-Date -Format 'yyyyMMdd-HHmmss')"
    descripcion = "Prueba automatizada del formulario de creación con venue y silletería."
    fechaIni = $fecha
    fechaFin = $fecha
    horaIni = "18:00"
    horaFin = "22:00"
    organizerName = "Tatiana Completo QA"
    TelPrin = "3001110002"
    TelSec = "3001110002"
    IndicativoTelPrinOrg = "+57"
    IndicativoTelSecOrg = "+57"
    email = $Email
    userId = $userId
    tipoEvento = $eventTypeId
    Categoria = $eventTypeId
    aforo = "100"
    modalidadEvt = "P"
    pais = "Colombia"
    ciudad = "Bogota"
    departamento = "Cundinamarca"
    direccion = "Carrera 7 # 32-16"
    tipoLugar = "otro"
    skipVenue = $true
    clase = "general"
    Hashtags = "#QA,#Wizard"
  }
  $res = Invoke-Api POST "/events/createEvent" $body -UseAuth
  $id = $res.data.id
  if (-not $id) { throw "createEvent no devolvió id: $($res | ConvertTo-Json -Compress)" }
  $script:eventId = $id
  Write-Host "  eventId=$eventId"
}

Test-Step "POST venues/venues con silletería (pasos 2-5 wizard)" {
  $gateId = New-Id
  $floorId = New-Id
  $catId = New-Id
  $seats = @()
  for ($r = 0; $r -lt 3; $r++) {
    $rowLabel = [char](65 + $r)
    for ($c = 1; $c -le 4; $c++) {
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
  $body = @{
    name = "Venue QA Test"
    ownerUserId = $userId
    eventId = $eventId
    hasSeating = $true
    capacity = 100
    address = "Carrera 7 # 32-16"
    city = "Bogota"
    department = "Cundinamarca"
    country = "Colombia"
    description = "Venue de prueba wizard"
    type = "stadium"
    status = "draft"
    gates = @(@{
      gateId = $gateId
      gateNumber = 1
      name = "Puerta principal"
      description = "Acceso general"
    })
    floors = @(@{
      floorId = $floorId
      name = "Planta baja"
      description = ""
      elements = @(@{
        elementId = (New-Id)
        name = "Escenario"
        type = "stage"
        geometry = "RECTANGLE"
        relX = 25
        relY = 5
        width = 50
        height = 12
        zIndex = 1
      })
      categories = @(@{
        categoryId = $catId
        name = "General"
        color = "#7C3AED"
        relX = 10
        relY = 20
        width = 80
        height = 60
        gateId = $gateId
        gateName = "Puerta principal"
        rows = 3
        seatsPerRow = 4
        hasPrice = $true
        costo = $true
        valor = 50000
        moneda = "COP"
        seats = $seats
        ticketCategory = @{
          categoria = "General"
          id = $catId
          cantidadTickets = 12
          moneda = "COP"
          costo = $true
          valor = 50000
          descripcion = "Boleta general QA"
          color = "#7C3AED"
        }
      })
    })
  }
  $res = Invoke-Api POST "/venues/venues" $body -UseAuth
  $vid = $res.venue.venueId
  if (-not $vid) { $vid = $res.venueId }
  if (-not $vid) { $vid = $res.id }
  if (-not $vid) { throw "venue sin id: $($res | ConvertTo-Json -Compress)" }
  $script:venueId = $vid
  Write-Host "  venueId=$venueId asientos=$($seats.Count)"
}

Test-Step "POST publishEvent (paso 6 wizard)" {
  $res = Invoke-Api POST "/events/publishEvent" @{ eventId = $eventId } -UseAuth
  $pubMsg = if ($res.message) { $res.message } else { $res.success }
  Write-Host "  publish: $pubMsg"
}

Test-Step "GET detalle del evento publicado" {
  $res = Invoke-Api GET "/events/getEvents/$eventId" $null -UseAuth
  $event = $res.data.datosEvento
  if (-not $event) { $event = $res.data.event }
  if (-not $event) { $event = $res.event }
  if (-not $event) { throw "no se pudo obtener el evento" }
  $status = $event.estatus
  Write-Host "  nombre=$($event.nombre) estatus=$status venueId=$($event.venueId)"
}

Test-Step "Verificar evento en lista del usuario" {
  $res = Invoke-Api GET "/events/getUserEvents/$userId" $null -UseAuth
  $events = if ($res.data.datosEvento) { @($res.data.datosEvento) } elseif ($res.events) { @($res.events) } elseif ($res.data) { @($res.data) } else { @() }
  $found = $events | Where-Object { $_.id -eq $eventId -or $_.eventId -eq $eventId }
  if (-not $found) { throw "evento $eventId no aparece en getUserEvents" }
  Write-Host "  encontrado en lista del organizador"
}

Write-Host "`n=== Resumen ===" -ForegroundColor Yellow
Write-Host "Pasaron: $passed" -ForegroundColor Green
Write-Host "Fallaron: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
if ($eventId) { Write-Host "Evento creado: $eventId" -ForegroundColor Cyan }
if ($failed -gt 0) { exit 1 }

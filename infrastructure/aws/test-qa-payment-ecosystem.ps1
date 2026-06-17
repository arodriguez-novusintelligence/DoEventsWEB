# Prueba ecosistema post-pago: orden -> callback APPROVED -> Mis boletas -> stats evento -> backoffice
param(
  [string]$ApiBase = "https://api-qa.doeventsapp.com",
  [string]$Email = "qa-full@doeventsapp.com",
  [string]$Password = "QaTest123!"
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

Write-Host "=== Prueba ecosistema pago QA ===" -ForegroundColor Yellow
Write-Host "API: $ApiBase"

Test-Step "Login" {
  $res = Invoke-RestMethod -Uri "$ApiBase/login/login" -Method POST -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
  if (-not $res.success) { throw $res.message }
  $script:token = $res.data.token
  $script:userId = $res.data.user.userId
  $script:headers = @{ Authorization = $script:token; "Content-Type" = "application/json" }
  Write-Host "  userId=$($script:userId)"
}

Test-Step "Evento con boletas disponibles" {
  $eventsRes = Invoke-RestMethod -Uri "$ApiBase/events/getUserEvents/$($script:userId)" -Method GET -Headers $script:headers
  $events = @()
  if ($eventsRes.data.datosEvento) { $events = @($eventsRes.data.datosEvento) }
  if ($events.Count -eq 0) { throw "Usuario sin eventos" }
  $script:eventId = $events[0].idEvento
  $seatsRes = Invoke-RestMethod -Uri "$ApiBase/orders/events/$($script:eventId)/available-seats" -Method GET -Headers $script:headers
  $script:category = $null
  foreach ($c in $seatsRes.categories) {
    if ($c.summary.availableSeats -gt 0) { $script:category = $c; break }
  }
  if (-not $script:category) { throw "Sin boletas disponibles" }
  $script:seat = ($script:category.seats | Where-Object { $_.ticketStatus -eq "AVAILABLE" } | Select-Object -First 1)
  if (-not $script:seat) { throw "Sin asiento AVAILABLE" }
  Write-Host "  evento=$($script:eventId) categoria=$($script:category.categoryName)"
}

Test-Step "Crear orden" {
  $ref = "WEB-QA-$(Get-Date -Format 'yyyyMMddHHmmss')-$(Get-Random -Maximum 9999)"
  $orderBody = @{
    reference = $ref
    amount_in_cents = [int](100000 * 100)
    currency = "COP"
    metadata = @{
      eventId = $script:eventId
      userID = $script:userId
      tickets = @(@{
        ticketInstanceId = $script:seat.ticketInstanceId
        distributionId = $script:category.distributionId
        createDate = $script:category.createDate
        category = $script:category.categoryName
        price = 100000
        location = $script:seat.location
      })
    }
  } | ConvertTo-Json -Depth 10
  $orderRes = Invoke-RestMethod -Uri "$ApiBase/orders/orders" -Method POST -Headers $script:headers -Body $orderBody
  $script:orderId = $orderRes.createOrder.order_id
  if (-not $script:orderId) { $script:orderId = $orderRes.order_id }
  if (-not $script:orderId) { throw "sin order_id" }
  Write-Host "  orderId=$($script:orderId)"
}

Test-Step "Stats evento antes del pago" {
  $stats = Invoke-RestMethod -Uri "$ApiBase/events/$($script:eventId)/statistics" -Method GET -Headers $script:headers
  $script:salesBefore = [int]($stats.totalVentas ?? $stats.executedSalesCount ?? 0)
  Write-Host "  totalVentas antes=$($script:salesBefore)"
}

Test-Step "Callback pago APPROVED (post-Wompi)" {
  $cbBody = @{
    reference = $script:orderId
    status = "APPROVED"
    payment_data = @{ source = "DoEventsWEB"; gateway = "wompi" }
    payment_method = @{ type = "web_checkout" }
  } | ConvertTo-Json
  $cbRes = Invoke-RestMethod -Uri "$ApiBase/orders/payments/callback" -Method POST -Headers $script:headers -Body $cbBody
  if (-not $cbRes.processPaymentCallback) { throw "sin processPaymentCallback" }
  Write-Host "  $($cbRes.processPaymentCallback.message)"
}

Test-Step "Boleta en Mis boletas (APPROVED)" {
  $ticketsRes = Invoke-RestMethod -Uri "$ApiBase/events/ordersList/$($script:userId)" -Method GET -Headers $script:headers
  $found = $false
  if ($ticketsRes.APPROVED) {
    foreach ($g in $ticketsRes.APPROVED) {
      if ($g.eventId -eq $script:eventId -and $g.tickets.Count -gt 0) { $found = $true; break }
    }
  }
  if (-not $found) { throw "No hay boletas APPROVED para el evento" }
}

Test-Step "Stats evento tras el pago" {
  $stats = Invoke-RestMethod -Uri "$ApiBase/events/$($script:eventId)/statistics" -Method GET -Headers $script:headers
  $salesAfter = [int]($stats.totalVentas ?? $stats.executedSalesCount ?? 0)
  Write-Host "  totalVentas despues=$salesAfter"
  if ($salesAfter -le $script:salesBefore) { throw "Las ventas no incrementaron" }
}

Test-Step "Indicadores backoffice" {
  try {
    $dash = Invoke-RestMethod -Uri "$ApiBase/backoffice/dashboard" -Method GET -Headers $script:headers
    $rev = $dash.revenueCop ?? $dash.data.revenueCop
    Write-Host "  revenueCop=$rev"
  } catch {
    Write-Host "  Requiere token admin de backoffice (omitido en prueba de usuario)" -ForegroundColor Yellow
  }
}

Write-Host "`n=== Resultado: $passed OK, $failed FAIL ===" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
if ($failed -gt 0) { exit 1 }

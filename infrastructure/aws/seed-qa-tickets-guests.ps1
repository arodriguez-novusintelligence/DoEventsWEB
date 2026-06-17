# Seed QA: invitados, invitaciones y orden demo para boletas/reembolsos
param(
    [string]$Region = "us-east-2",
    [string]$OrganizerUserId = "qa-full-01",
    [string]$GuestUserId = "qa-gust-01",
    [string]$EventId = "qa-demo-own-001"
)

$ErrorActionPreference = "Stop"
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$orderId = "qa-order-demo-001"
$ticketId = "qa-ticket-demo-001"

function Put-DynamoItem($TableName, $Item) {
    $file = Join-Path $env:TEMP "dynamo-seed-$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 8 -Compress
    [System.IO.File]::WriteAllText($file, $json, [System.Text.UTF8Encoding]::new($false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($file -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
    Remove-Item $file -ErrorAction SilentlyContinue
}

Write-Host "=== Sembrando invitados e invitaciones QA ===" -ForegroundColor Cyan

# Invitados del evento (tabla EventGuests-qa)
@(
    @{
        guestId = "guest-demo-001"
        name = "Carlos Mendoza"
        email = "carlos.demo@doeventsapp.com"
        phone = "+573001112233"
        category = "manual"
    },
    @{
        guestId = "guest-demo-002"
        name = "Usuario Gustos QA"
        email = "qa-gustos@doeventsapp.com"
        userId = $GuestUserId
        category = "registered"
    }
) | ForEach-Object {
    $item = @{
        eventId = @{ S = $EventId }
        guestId = @{ S = $_.guestId }
        name = @{ S = $_.name }
        email = @{ S = $_.email }
        category = @{ S = $_.category }
        createdAt = @{ S = $now }
        updatedAt = @{ S = $now }
    }
    if ($_.phone) { $item.phone = @{ S = $_.phone } }
    if ($_.userId) { $item.userId = @{ S = $_.userId } }
    Put-DynamoItem "EventGuests-qa" $item
    Write-Host "  EventGuests-qa: $($_.name)" -ForegroundColor Green
}

# Invitaciones recibidas por qa-gust-01 (tabla EventInvitations-qa, GSI UserIdIndex)
$invitations = @(
    @{
        invitationId = "inv-demo-pending-001"
        eventId = $EventId
        userId = $GuestUserId
        status = "pending"
        eventName = "Festival QA Creado por Mi"
        message = "Te invitamos al Festival QA. Confirma tu asistencia."
    },
    @{
        invitationId = "inv-demo-accepted-001"
        eventId = "qa-demo-own-002"
        userId = $GuestUserId
        status = "accepted"
        eventName = "Workshop DoEvents QA"
        message = "Invitacion aceptada previamente."
    }
)

foreach ($inv in $invitations) {
    Put-DynamoItem "EventInvitations-qa" @{
        PK = @{ S = "EVENT#$($inv.eventId)" }
        SK = @{ S = "USER#$($inv.userId)#$($inv.invitationId)" }
        invitationId = @{ S = $inv.invitationId }
        eventId = @{ S = $inv.eventId }
        userId = @{ S = $inv.userId }
        invitedBy = @{ S = $OrganizerUserId }
        inviterName = @{ S = "Tatiana Completo QA" }
        eventName = @{ S = $inv.eventName }
        status = @{ S = $inv.status }
        message = @{ S = $inv.message }
        channels = @{ L = @(@{ S = "inApp" }, @{ S = "email" }) }
        createdAt = @{ S = $now }
        updatedAt = @{ S = $now }
    }
    Write-Host "  EventInvitations-qa: $($inv.eventName) ($($inv.status))" -ForegroundColor Green
}

# Orden demo pagada para qa-full-01 (reembolsos / boletas)
Put-DynamoItem "Orders-qa" @{
    order_id = @{ S = $orderId }
    userId = @{ S = $OrganizerUserId }
    payment_status = @{ S = "APPROVED" }
    status = @{ S = "CONFIRMED" }
    amount = @{ N = "85000" }
    currency = @{ S = "COP" }
    createdAt = @{ S = $now }
    updatedAt = @{ S = $now }
    metadata = @{
        M = @{
            reference = @{ S = $orderId }
            eventId = @{ S = $EventId }
            eventName = @{ S = "Festival QA Creado por Mi" }
            userId = @{ S = $OrganizerUserId }
            orderTotals = @{
                M = @{
                    total_amount = @{ N = "85000" }
                    subtotal = @{ N = "80000" }
                    service_fee = @{ N = "5000" }
                }
            }
        }
    }
}
Write-Host "  Orders-qa: $orderId (qa-full-01)" -ForegroundColor Green

# Ticket confirmado para control de accesos / QR
Put-DynamoItem "Tickets-qa" @{
    ticket_id = @{ S = $ticketId }
    id = @{ S = $ticketId }
    order_id = @{ S = $orderId }
    event_id = @{ S = $EventId }
    user_id = @{ S = $OrganizerUserId }
    category = @{ S = "General" }
    status = @{ S = "CONFIRMED" }
    price = @{ N = "80000" }
    qr_code = @{ S = "QA-DEMO-QR-$ticketId" }
    created_at = @{ S = $now }
}
Write-Host "  Tickets-qa: $ticketId" -ForegroundColor Green

Write-Host "`n=== Seed completado ===" -ForegroundColor Green
Write-Host "Evento: $EventId | Orden: $orderId | Ticket: $ticketId"
Write-Host "Usuario organizador: $OrganizerUserId | Invitado demo: $GuestUserId"

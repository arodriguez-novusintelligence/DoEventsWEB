# Seed asignaciones staff QA (organizer qa-full-01, staff qa-comm-*)
param(
    [string]$Region = "us-east-2",
    [string]$Table = "StaffAccess-qa"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
$now = (Get-Date).ToUniversalTime().ToString("o")

New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-StaffItem($userId, $eventId, $gateId, $gateName, $venueId, $venueName, $eventName) {
    $sk = "$eventId#$gateId"
    $jsonPath = Join-Path $ItemsDir "staff-$([Guid]::NewGuid().ToString('N')).json"
    $item = @{
        userId = @{ S = $userId }
        sk = @{ S = $sk }
        eventId = @{ S = $eventId }
        gateId = @{ S = $gateId }
        gateName = @{ S = $gateName }
        venueId = @{ S = $venueId }
        venueName = @{ S = $venueName }
        eventName = @{ S = $eventName }
        assignedAt = @{ S = $now }
    }
    $json = $item | ConvertTo-Json -Depth 6 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $Table --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $Table" }
    Write-Host "  Staff $userId -> $eventName / $gateName" -ForegroundColor Green
}

Write-Host "=== Sembrando StaffAccess QA ===" -ForegroundColor Cyan

# Torneo Girardot: 2 puertas, 3 staff
Put-StaffItem "qa-comm-01" "qa-map-girardot-001" "gate-main" "Entrada Principal" "venue-qa-girardot" "Malecon Girardot" "Torneo de Futbol en Girardot"
Put-StaffItem "qa-comm-02" "qa-map-girardot-001" "gate-main" "Entrada Principal" "venue-qa-girardot" "Malecon Girardot" "Torneo de Futbol en Girardot"
Put-StaffItem "qa-comm-03" "qa-map-girardot-001" "gate-vip" "Zona VIP" "venue-qa-girardot" "Malecon Girardot" "Torneo de Futbol en Girardot"

# Concierto Bogota
Put-StaffItem "qa-comm-04" "qa-map-bogota-004" "gate-norte" "Acceso Norte" "venue-qa-bogota" "Parque Simon Bolivar" "Festival Musical Bogota"
Put-StaffItem "qa-comm-01" "qa-map-bogota-004" "gate-sur" "Acceso Sur" "venue-qa-bogota" "Parque Simon Bolivar" "Festival Musical Bogota"

Write-Host "=== Seed staff-access completado ===" -ForegroundColor Green

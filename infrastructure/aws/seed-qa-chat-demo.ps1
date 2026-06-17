# Seed chats QA para qa-full-01 (directo + evento + mensajes)
param(
    [string]$Region = "us-east-2",
    [string]$ChatsTable = "Chats-qa",
    [string]$MessagesTable = "ChatMessage-qa",
    [string]$UserId = "qa-full-01",
    [string]$OtherUserId = "qa-gust-01",
    [string]$EventId = "qa-map-girardot-001"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-DynamoItem($TableName, $Item) {
    $jsonPath = Join-Path $ItemsDir "$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 10 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
}

$directRoomId = "qa-chat-direct-full-gust"
$eventRoomId = "qa-chat-event-girardot"
$now = (Get-Date).ToUniversalTime().ToString("o")
$ts1 = (Get-Date).ToUniversalTime().AddMinutes(-45).ToString("o")
$ts2 = (Get-Date).ToUniversalTime().AddMinutes(-30).ToString("o")
$ts3 = (Get-Date).ToUniversalTime().AddMinutes(-15).ToString("o")
$ts4 = (Get-Date).ToUniversalTime().AddMinutes(-5).ToString("o")

Write-Host "=== Seed chats QA ===" -ForegroundColor Cyan

Put-DynamoItem $ChatsTable @{
    id = @{ S = "qa-chat-record-direct-001" }
    updatedAt = @{ S = $now }
    roomId = @{ S = $directRoomId }
    createdAt = @{ S = $ts1 }
    target = @{ L = @(@{ S = "room::direct" }) }
    participants = @{ L = @(@{ S = $UserId }, @{ S = $OtherUserId }) }
    adminId = @{ L = @(@{ S = $UserId }) }
    administrators = @{ L = @(@{ S = $UserId }) }
    blacklist = @{ L = @() }
    messages = @{ L = @() }
}

Put-DynamoItem $ChatsTable @{
    id = @{ S = "qa-chat-record-event-001" }
    updatedAt = @{ S = $now }
    roomId = @{ S = $eventRoomId }
    createdAt = @{ S = $ts1 }
    event = @{ S = $EventId }
    target = @{ L = @(@{ S = "room::event" }) }
    participants = @{ L = @(@{ S = $UserId }, @{ S = $OtherUserId }) }
    adminId = @{ L = @(@{ S = $UserId }) }
    administrators = @{ L = @(@{ S = $UserId }) }
    blacklist = @{ L = @() }
    messages = @{ L = @() }
}

$messages = @(
    @{ id = "qa-chat-msg-001"; roomId = $directRoomId; sender = $OtherUserId; text = "Hola Tatiana, confirmas asistencia al evento de Girardot?"; createdAt = $ts1 },
    @{ id = "qa-chat-msg-002"; roomId = $directRoomId; sender = $UserId; text = "Si, ya tengo mi entrada. Nos vemos alla!"; createdAt = $ts2 },
    @{ id = "qa-chat-msg-003"; roomId = $directRoomId; sender = $OtherUserId; text = "Perfecto. Te escribo si hay cambio de horario."; createdAt = $ts3 },
    @{ id = "qa-chat-msg-004"; roomId = $eventRoomId; sender = $UserId; text = "Hola a todos! Bienvenidos al chat del Torneo en Girardot."; createdAt = $ts2 },
    @{ id = "qa-chat-msg-005"; roomId = $eventRoomId; sender = $OtherUserId; text = "Gracias por la info. A que hora es la premiacion?"; createdAt = $ts3 },
    @{ id = "qa-chat-msg-006"; roomId = $eventRoomId; sender = $UserId; text = "La premiacion es a las 11:30 AM en el malecon."; createdAt = $ts4 }
)

foreach ($msg in $messages) {
    Put-DynamoItem $MessagesTable @{
        id = @{ S = $msg.id }
        createdAt = @{ S = $msg.createdAt }
        updatedAt = @{ S = $msg.createdAt }
        roomId = @{ S = $msg.roomId }
        sender = @{ S = $msg.sender }
        text = @{ S = $msg.text }
        status = @{ S = "active" }
        type = @{ S = "message-text" }
        reactions = @{ L = @() }
        reads = @{ L = @(@{ S = $msg.sender }) }
        deletedAt = @{ S = "" }
        asset = @{ NULL = $true }
    }
    Write-Host "  Mensaje: $($msg.text.Substring(0, [Math]::Min(40, $msg.text.Length)))..." -ForegroundColor Green
}

Write-Host "=== Chats seed completado ===" -ForegroundColor Green

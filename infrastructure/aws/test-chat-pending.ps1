# Prueba E2E chat directo con solicitud de aceptación (QA)
param(
  [string]$BaseUrl = "https://api-qa.doeventsapp.com",
  [string]$Password = "QaTest123!",
  [string]$SenderEmail = "qa-full@doeventsapp.com",
  [string]$ReceiverEmail = "qa-gustos@doeventsapp.com",
  [switch]$ResetRooms
)

$ErrorActionPreference = "Stop"

function Login([string]$email) {
  $body = @{ email = $email; password = $Password } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$BaseUrl/login/login" -Method POST -Body $body -ContentType "application/json"
  return @{ token = $res.data.token; userId = $res.data.user.userId }
}

function AuthHeaders([string]$token) {
  return @{
    Authorization = $token
    Accept = "application/json"
    "Content-Type" = "application/json"
  }
}

function Write-JsonFile([string]$path, $obj) {
  $json = $obj | ConvertTo-Json -Compress -Depth 6
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
}

function Soft-DeleteDirectRoom([string]$roomId) {
  $valsPath = Join-Path $env:TEMP "chat-query-$roomId.json"
  Write-JsonFile $valsPath @{ ":r" = @{ S = $roomId } }
  $data = aws dynamodb query `
    --table-name Chats-qa `
    --index-name roomId-index `
    --key-condition-expression "roomId = :r" `
    --expression-attribute-values "file://$valsPath" `
    --region us-east-2 `
    --output json | ConvertFrom-Json
  $now = (Get-Date).ToUniversalTime().ToString("o")
  foreach ($item in $data.Items) {
    $id = $item.id.S
    $updatedAt = $item.updatedAt.S
    $keyPath = Join-Path $env:TEMP "chat-key.json"
    Write-JsonFile $keyPath @{ id = @{ S = $id }; updatedAt = @{ S = $updatedAt } }
    $updPath = Join-Path $env:TEMP "chat-upd.json"
    Write-JsonFile $updPath @{ ":d" = @{ S = $now } }
    aws dynamodb update-item `
      --table-name Chats-qa `
      --region us-east-2 `
      --key "file://$keyPath" `
      --update-expression "SET deletedAt = :d" `
      --expression-attribute-values "file://$updPath" | Out-Null
    Write-Host "Soft-deleted room $roomId ($id)" -ForegroundColor Yellow
  }
}

$sender = Login $SenderEmail
$receiver = Login $ReceiverEmail
Write-Host "Sender=$($sender.userId) Receiver=$($receiver.userId)" -ForegroundColor Cyan

$ids = @($sender.userId, $receiver.userId) | Sort-Object
$roomId = "direct_$($ids[0])_$($ids[1])"
if ($ResetRooms) {
  Soft-DeleteDirectRoom $roomId
}

$hSender = AuthHeaders $sender.token
$hReceiver = AuthHeaders $receiver.token

$chatBody = @{ userA = $sender.userId; userB = $receiver.userId } | ConvertTo-Json
$chat = Invoke-RestMethod -Uri "$BaseUrl/chats/get-or-create-direct-chat-room" -Method POST -Body $chatBody -Headers $hSender
Write-Host "[1] Solicitud: status=$($chat.status) canMessage=$($chat.canMessage) invitationPending=$($chat.invitationPending) created=$($chat.created)"
Write-Host "    participants=$($chat.room.participants -join ',') pending=$($chat.room.pendingParticipants -join ',')"

$roomsReceiver = Invoke-RestMethod -Uri "$BaseUrl/chats/chats-rooms-by-user/$($receiver.userId)" -Headers $hReceiver
$pendingRoom = $roomsReceiver | Where-Object { $_.roomId -eq $chat.room.roomId } | Select-Object -First 1
Write-Host "[2] Receptor: invitationPending=$($pendingRoom.invitationPending) canMessage=$($pendingRoom.canMessage) status=$($pendingRoom.directChatStatus)"

if ($pendingRoom.invitationPending) {
  $acceptBody = @{ userId = $receiver.userId; roomId = $chat.room.roomId } | ConvertTo-Json
  $accept = Invoke-RestMethod -Uri "$BaseUrl/chats/accept-invitation-chat-room" -Method PUT -Body $acceptBody -Headers $hReceiver
  Write-Host "[3] Aceptar: $($accept.statusDesc)" -ForegroundColor Green
} else {
  Write-Host "[3] Sin invitación pendiente (sala ya activa o legacy)" -ForegroundColor Yellow
}

$roomsAfter = Invoke-RestMethod -Uri "$BaseUrl/chats/chats-rooms-by-user/$($sender.userId)" -Headers $hSender
$active = $roomsAfter | Where-Object { $_.roomId -eq $chat.room.roomId } | Select-Object -First 1
Write-Host "[4] Tras flujo: canMessage=$($active.canMessage) invitationPending=$($active.invitationPending)"

$chat2 = Invoke-RestMethod -Uri "$BaseUrl/chats/get-or-create-direct-chat-room" -Method POST -Body $chatBody -Headers $hSender
Write-Host "[5] Re-solicitud: status=$($chat2.status) canMessage=$($chat2.canMessage) invitationPending=$($chat2.invitationPending)"

# Búsqueda Andres Rodriguez
$search = Invoke-RestMethod -Uri "$BaseUrl/users/searchUsers?q=andres%20rodriguez" -Headers $hSender
Write-Host "[6] Búsqueda Andres: count=$($search.count) user=$($search.users[0].user) id=$($search.users[0].id)"

if ($search.count -ge 1) {
  $andresId = $search.users[0].id
  $andresRoomBody = @{ userA = $sender.userId; userB = $andresId } | ConvertTo-Json
  $andresIds = @($sender.userId, $andresId) | Sort-Object
  $andresRoomId = "direct_$($andresIds[0])_$($andresIds[1])"
  if ($ResetRooms) { Soft-DeleteDirectRoom $andresRoomId }
  $andresChat = Invoke-RestMethod -Uri "$BaseUrl/chats/get-or-create-direct-chat-room" -Method POST -Body $andresRoomBody -Headers $hSender
  Write-Host "[7] Chat Andres: status=$($andresChat.status) canMessage=$($andresChat.canMessage) invitationPending=$($andresChat.invitationPending)"
  Write-Host "    participants=$($andresChat.room.participants -join ',') pending=$($andresChat.room.pendingParticipants -join ',')"
}

Write-Host "`nPrueba completada." -ForegroundColor Green

# Prueba upload de imagen en chat QA (init -> S3 PUT -> complete)
param(
  [string]$BaseUrl = "https://api-qa.doeventsapp.com",
  [string]$Password = "QaTest123!",
  [string]$SenderEmail = "qa-full@doeventsapp.com",
  [string]$ReceiverEmail = "qa-gustos@doeventsapp.com"
)

$ErrorActionPreference = "Stop"

function Login([string]$email) {
  $body = @{ email = $email; password = $Password } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$BaseUrl/login/login" -Method POST -Body $body -ContentType "application/json"
  return @{ token = $res.data.token; userId = $res.data.user.userId }
}

$h = @{
  Authorization = (Login $SenderEmail).token
  Accept = "application/json"
  "Content-Type" = "application/json"
}
$sender = Login $SenderEmail
$receiver = Login $ReceiverEmail
$h.Authorization = $sender.token

$chatBody = @{ userA = $sender.userId; userB = $receiver.userId } | ConvertTo-Json
$chat = Invoke-RestMethod -Uri "$BaseUrl/chats/get-or-create-direct-chat-room" -Method POST -Body $chatBody -Headers $h
$roomId = $chat.room.roomId
Write-Host "roomId=$roomId"

$initBody = @{
  roomId = $roomId
  fileName = "test-chat.jpg"
  fileType = "image/jpeg"
  size = 128
  senderId = $sender.userId
} | ConvertTo-Json

$init = Invoke-RestMethod -Uri "$BaseUrl/chats/chat-media-upload/init" -Method POST -Body $initBody -Headers $h
Write-Host "init uploadUrl ok=$([bool]$init.uploadUrl) mediaKey=$($init.mediaKey)"

$bytes = [byte[]](1..128 | ForEach-Object { 0xFF })
Invoke-RestMethod -Uri $init.uploadUrl -Method PUT -Body $bytes -ContentType "image/jpeg" | Out-Null
Write-Host "S3 PUT ok"

$completeBody = @{ mediaKey = $init.mediaKey } | ConvertTo-Json
$done = Invoke-RestMethod -Uri "$BaseUrl/chats/chat-media-upload/complete" -Method POST -Body $completeBody -Headers $h
Write-Host "complete mediaUrl=$($done.mediaUrl)"
Write-Host "=== Chat media upload: OK ===" -ForegroundColor Green

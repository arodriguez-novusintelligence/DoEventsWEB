# Corrige variables de entorno QA (-qa) en lambdas us-east-2
param([string]$Region = "us-east-2")

$ErrorActionPreference = "Stop"

$usersEnv = @{
  CLIENT_TABLE = "Client-qa"
  FAVORITE_USERS_TABLE = "FavoriteUsers-qa"
  IMAGE_TABLE = "imagenes-qa"
  EVENTS_TABLE = "Eventos-qa"
  ORDERS_TABLE = "Orders-qa"
  EVENT_INVITATIONS_TABLE = "EventInvitations-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  PROFILE_BUCKET = "doevents-profile-media-qa"
  PROFILE_BUCKET_REGION = "us-east-2"
}

$eventsEnv = @{
  EVENTS_TABLE = "Eventos-qa"
  CLIENT_TABLE = "Client-qa"
  ORDERS_TABLE = "Orders-qa"
  IMAGE_TABLE = "imagenes-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  PREFERENCES_TABLE = "Preferences-qa"
  EVENT_TYPE_TABLE = "TipoEvento-qa"
  PLACE_TYPE_TABLE = "TipoLugar-qa"
  EVENT_CALIFICATION_TABLE = "EventCalification-qa"
  FAV_TABLE = "userFavoriteEvents-qa"
  TICKETS_DIST_TABLE = "TicketsDistribution-qa"
  TICKETS_CANCELATION_TABLE = "ticketsCancelation-qa"
  CHATS_TABLE = "Chats-qa"
  USER_STATS_TABLE = "UserStats-qa"
  STAGE = "qa"
  DYNAMODB_REGION = "us-east-2"
  API_PUBLIC_BASE_URL = "https://api-qa.doeventsapp.com"
  EVENT_LIFECYCLE_SCHEDULER_UPSERT_LAMBDA = "events-lifecycle-manager-scheduler-upsert-qa"
  NOTIFICATIONS_LAMBDA = "notifications-qa-triggerNotification"
  NOTIFICATIONS_API = "https://api-qa.doeventsapp.com/notifications/trigger-notification"
  WEB_APP_BASE_URL = "https://qa.doeventsapp.com"
}

$eventTypeEnv = @{
  EVENT_TYPE_TABLE = "TipoEvento-qa"
  TABLE_NAME = "TipoEvento-qa"
  DYNAMODB_REGION = "us-east-2"
  STAGE = "qa"
}

$venuesEnv = @{
  VENUE_TABLE = "Venues-qa"
  VENUE_FLOOR_TABLE = "Venue_Floor-qa"
  VENUE_ELEMENT_TABLE = "Venue_Element-qa"
  VENUE_CATEGORY_TABLE = "Venue_Category-qa"
  VENUE_SEAT_TABLE = "Venue_Seat-qa"
  VENUE_GATE_TABLE = "Venue_Gate-qa"
  VENUE_LIKES_TABLE = "Venue_Likes-qa"
  VENUE_RATINGS_TABLE = "VenueCalification-qa"
  CLIENT_TABLE = "Client-qa"
  EVENTS_TABLE = "Eventos-qa"
  TICKETS_TABLE = "Tickets-qa"
  TICKETS_DIST_TABLE = "TicketsDistribution-qa"
  VENUE_IMAGES_BUCKET = "doevent-venue-images"
  EVENT_LIFECYCLE_SCHEDULER_UPSERT_FUNCTION = "events-lifecycle-manager-scheduler-upsert-qa"
  DYNAMODB_REGION = "us-east-2"
  STAGE = "qa"
}

$imagesEnv = @{
  TABLE_NAME = "imagenes-qa"
  IMAGE_TABLE = "imagenes-qa"
  imagesTable = "imagenes-qa"
  EVENTS_TABLE = "Eventos-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  IMAGE_BUCKET_REGION = "us-east-1"
  imageBucket = "doeventimageeventbucket"
}

$loginEnv = @{
  CLIENT_TABLE = "Client-qa"
  USER_PREFERENCES_TABLE = "UserPreferences-qa"
  FAVORITE_USERS_TABLE = "FavoriteUsers-qa"
  BACKOFFICE_TABLE = "doevents-backoffice-qa-users"
  BACKOFFICE_REGION = "us-east-2"
  DYNAMODB_REGION = "us-east-2"
  APPLE_CALLBACK_LANDING_URL = "https://qa.doeventsapp.com/apple-callback"
}

$feedEnv = @{
  DYNAMODB_REGION = "us-east-2"
  EVENTS_TABLE = "Eventos-qa"
  FOLLOW_TABLE = "Followers-qa"
  PREFS_TABLE = "UserPreferences-qa"
  DEVICE_TABLE = "DeviceData-qa"
  IMAGES_TABLE = "imagenes-qa"
  IMAGE_TABLE = "imagenes-qa"
  FAV_TABLE = "userFavoriteEvents-qa"
  VENUES_TABLE = "Venues-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  STAGE = "qa"
}

function Update-LambdaEnv($FunctionName, $Vars) {
  $current = aws lambda get-function-configuration --function-name $FunctionName --region $Region --query "Environment.Variables" --output json 2>$null
  $merged = @{}
  if ($current -and $current -ne "null") {
    ($current | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $merged[$_.Name] = $_.Value }
  }
  $Vars.GetEnumerator() | ForEach-Object { $merged[$_.Key] = $_.Value }
  $envObj = @{ Variables = $merged }
  $envJson = $envObj | ConvertTo-Json -Compress -Depth 5
  $envFile = Join-Path $env:TEMP "lambda-env-$FunctionName.json"
  [System.IO.File]::WriteAllText($envFile, $envJson, [System.Text.UTF8Encoding]::new($false))
  Write-Host "  -> $FunctionName"
  aws lambda update-function-configuration --function-name $FunctionName --region $Region --environment "file://$envFile" --output text --query "FunctionName" | Out-Null
}

Write-Host "=== manageusers ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-manageusers-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $usersEnv } }

Write-Host "=== manageevent ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-manageevent-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $eventsEnv } }

Write-Host "=== imagenes ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-imagenes-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $imagesEnv } }

Write-Host "=== login ===" -ForegroundColor Cyan
@("aws-lambda-login-qa-login","aws-lambda-login-qa-googleAuth","aws-lambda-login-qa-appleAuth","aws-lambda-login-qa-appleCallback") |
  ForEach-Object { Update-LambdaEnv $_ $loginEnv }

Write-Host "=== eventsFeed ===" -ForegroundColor Cyan
Update-LambdaEnv "aws-lambda-eventsFeed-qa-getEvents" $feedEnv

$ordersEnv = @{
  ORDERS_TABLE = "Orders-qa"
  EVENTS_TABLE = "Eventos-qa"
  TICKETS_TABLE = "Tickets-qa"
  ACCESS_LOGS_TABLE = "AccessLogs-qa"
  SEATS_TABLE = "Seats-qa"
  RESERVATIONS_TABLE = "Reservations-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  IMAGE_TABLE = "imagenes-qa"
  TICKETS_DIST_TABLE = "TicketsDistribution-qa"
  CLIENT_TABLE = "Client-qa"
  STAGE = "qa"
  NOTIFICATIONS_API = "https://api-qa.doeventsapp.com/notifications/trigger-notification"
  WEBSOCKET_ENDPOINT = "wss://ws-qa.doeventsapp.com"
}

$whatsappPhoneId = if ($env:WHATSAPP_PHONE_ID) { $env:WHATSAPP_PHONE_ID } else { "588313857701989" }
$metaAccessToken = if ($env:META_ACCESS_TOKEN) { $env:META_ACCESS_TOKEN } else { "" }

$notificationsEnv = @{
  NOTIFICATIONS_TABLE = "Notifications-qa"
  USER_CHANNELS_TABLE = "UserChannels-qa"
  CLIENT_TABLE = "Client-qa"
  ORDERS_TABLE = "Orders-qa"
  FAVORITE_USERS_TABLE = "FavoriteUsers-qa"
  USER_TOKENS_TABLE = "UserTokens-qa"
  WEBHOOK_LOGS_TABLE = "WhatsAppWebhookLogs-qa"
  IMAGES_TABLE = "imagenes-qa"
  STAGE = "qa"
  EMAIL_FROM = "notificaciones.doevents@doeventsapp.com"
  DYNAMODB_REGION = "us-east-2"
  WEB_APP_BASE_URL = "https://qa.doeventsapp.com"
  WHATSAPP_PHONE_ID = $whatsappPhoneId
  META_ACCESS_TOKEN = $metaAccessToken
  WHATSAPP_VERIFY_TOKEN = "doevents_webhook_2026"
  CORS_ALLOWED_ORIGINS = "https://qa.doeventsapp.com,http://localhost:5173"
}

Write-Host "=== orders-manageTickets ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-orders-manageTickets-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $ordersEnv } }

Write-Host "=== notifications ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'notifications-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $notificationsEnv } }

$guestsEnv = @{
  CLIENT_TABLE = "Client-qa"
  EVENTS_TABLE = "Eventos-qa"
  EVENTS_ALT_TABLE = "Eventos-qa"
  EVENT_GUESTS_TABLE = "EventGuests-qa"
  EVENT_INVITATIONS_TABLE = "EventInvitations-qa"
  EVENT_GROUPS_TABLE = "EventGroups-qa"
  FAVORITE_USERS_TABLE = "FavoriteUsers-qa"
  FAVORITE_GROUPS_TABLE = "FavoriteGroups-qa"
  FOLLOWERS_TABLE = "Followers-qa"
  IMAGE_TABLE = "imagenes-qa"
  IMAGE_BUCKET = "doeventimageeventbucket"
  PROFILE_IMAGES_BUCKET = "doeventprofileimagesbucket"
  NOTIFICATIONS_FUNCTION = "notifications-qa-triggerNotification"
}

Write-Host "=== guests ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-guests-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $guestsEnv } }

$chatEnv = @{
  CHATS_TABLE = "Chats-qa"
  EVENTOS_TABLE = "Eventos-qa"
  IMAGENES_TABLE = "imagenes-qa"
  CLIENT_TABLE = "Client-qa"
  USER_CHANNELS_TABLE = "UserChannels-qa"
  CHAT_IDEMPOTENCY_TABLE = "ChatMessageIdempotency-qa"
  MESSAGES_TABLE = "ChatMessage-qa"
  CHAT_MEDIA_BUCKET = "doeventschatroombucket"
  CHAT_MEDIA_BUCKET_REGION = "us-east-1"
  DYNAMODB_REGION = "us-east-2"
  STAGE = "qa"
  API_PUBLIC_BASE_URL = "https://api-qa.doeventsapp.com"
  WEB_APP_BASE_URL = "https://qa.doeventsapp.com"
  WS_API_ENDPOINT = "wss://zjg66jel41.execute-api.us-east-2.amazonaws.com/qa"
  NOTIFICATIONS_FUNCTION = "notifications-qa-triggerNotification"
}

Write-Host "=== EventType ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-EventType-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $eventTypeEnv } }

Write-Host "=== venues ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-venues-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $venuesEnv } }

Write-Host "=== chat-room-events ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'chat-room-events-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $chatEnv } }

$wallEnv = @{
  DYNAMODB_REGION = "us-east-2"
  DYNAMODB_EXTENDED_REGION = "us-east-2"
  DYNAMODB_CLIENT_TABLE = "Client-qa"
  DYNAMODB_POSTS_TABLE = "Posts-qa"
  DYNAMODB_EVENTS_TABLE = "Eventos-qa"
  DYNAMODB_EVENT_INVITATIONS_TABLE = "EventInvitations-qa"
  DYNAMODB_EVENT_IMAGES_TABLE = "imagenes-qa"
  DYNAMODB_PLACES_TABLE = "Places-qa"
  DYNAMODB_FOLLOWERS_TABLE = "Followers-qa"
  DYNAMODB_FOLLOWERS_BY_TARGET_INDEX = "followUserIdIndex"
  DYNAMODB_REPOSTS_TABLE = "Reposts-qa"
  DYNAMODB_LIKES_TABLE = "Likes-qa"
  DYNAMODB_COMMENTS_TABLE = "Comments-qa"
  DYNAMODB_REPORTS_TABLE = "Reports-qa"
  DYNAMODB_BLOCKUSER_TABLE = "BlockUser-qa"
  DYNAMODB_NOTINTERESTED_TABLE = "NotInterested-qa"
  DYNAMODB_FEED_PUBLICATIONS_TABLE = "FeedPublications-qa"
  DYNAMODB_FEED_TIMELINE_TABLE = "FeedTimeline-qa"
  DYNAMODB_FEED_PUBLICATION_LIKES_TABLE = "FeedPublicationLikes-qa"
  DYNAMODB_FEED_PUBLICATION_REPOSTS_TABLE = "FeedPublicationReposts-qa"
  DYNAMODB_FEED_COMMENTS_TABLE = "FeedComments-qa"
  DYNAMODB_FEED_COMMENT_LIKES_TABLE = "FeedCommentLikes-qa"
  DYNAMODB_FEED_SHARES_TABLE = "FeedShares-qa"
  DYNAMODB_FEED_MEDIA_TABLE = "FeedMedia-qa"
  DYNAMODB_FEED_IDEMPOTENCY_TABLE = "FeedIdempotency-qa"
  FEED_MEDIA_BUCKET = "aws-lambda-wall-social-media-qa-media-519010577666"
  EVENT_IMAGES_BUCKET = "doeventimageeventbucket"
  NOTIFICATIONS_TRIGGER_FUNCTION_NAME = "notifications-qa-triggerNotification"
}

Write-Host "=== wall-social-media ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-wall-social-media-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $wallEnv } }

$authEnv = @{
  OTP_TABLE = "OTPCode-qa"
  CLIENT_TABLE = "Client-qa"
  PREFERENCES_TABLE = "Preferences-qa"
  USER_PREFERENCES_TABLE = "UserPreferences-qa"
  SES_FROM_EMAIL = "appeventplace@gmail.com"
  WHATSAPP_PHONE_ID = $whatsappPhoneId
  META_ACCESS_TOKEN = $metaAccessToken
  CORS_ALLOWED_ORIGINS = "https://qa.doeventsapp.com,http://localhost:5173"
  WEB_APP_BASE_URL = "https://qa.doeventsapp.com"
}

Write-Host "=== generateotp (SMS/WhatsApp QA) ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-generateotp-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $authEnv } }

$servicesEnv = @{
  SERVICES_TABLE = "ServiceProviders-qa"
  SERVICE_RATINGS_TABLE = "ServiceCalification-qa"
  CLIENT_TABLE = "Client-qa"
  DYNAMODB_REGION = "us-east-2"
  PROFILE_IMAGES_BUCKET = "doeventprofileimagesbucket"
  CORS_ALLOWED_ORIGINS = "https://qa.doeventsapp.com,http://localhost:5173"
}

Write-Host "=== services ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'aws-lambda-services-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $servicesEnv } }

$staffAccessEnv = @{
  STAFF_ACCESS_TABLE_NAME = "StaffAccess-qa"
  USERS_TABLE = "Client-qa"
  EVENTS_TABLE = "Eventos-qa"
  VENUES_TABLE = "Venues-qa"
  NOTIFICATIONS_FUNCTION = "notifications-qa-triggerNotification"
  PROFILE_IMAGES_BUCKET = "doeventprofileimagesbucket"
  PROFILE_IMAGES_BUCKET_REGION = "us-east-1"
  DYNAMODB_REGION = "us-east-2"
  CORS_ALLOWED_ORIGINS = "https://qa.doeventsapp.com,http://localhost:5173"
}

Write-Host "=== staff-access ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'staff-access-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $staffAccessEnv } }

$cursorApiKey = if ($env:CURSOR_API_KEY) { $env:CURSOR_API_KEY } else { "" }
$agentesIaEnv = @{
  CURSOR_API_KEY = $cursorApiKey
  CURSOR_MODEL = if ($env:CURSOR_MODEL) { $env:CURSOR_MODEL } else { "composer-2.5" }
}

Write-Host "=== agentes-ia ===" -ForegroundColor Cyan
aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName,'doevents-agentes-ia-qa-')].FunctionName" --output text |
  ForEach-Object { $_.Split("`t") } | ForEach-Object { if ($_) { Update-LambdaEnv $_ $agentesIaEnv } }

Write-Host "=== Listo ===" -ForegroundColor Green

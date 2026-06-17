# Usuarios de comunidad QA: perfiles completos, eventos, historias y chats
param(
    [string]$Region = "us-east-2",
    [string]$ClientTable = "Client-qa",
    [string]$EventsTable = "Eventos-qa",
    [string]$ImagesTable = "imagenes-qa",
    [string]$StoriesTable = "FeedPublications-qa",
    [string]$ChatsTable = "Chats-qa",
    [string]$MessagesTable = "ChatMessage-qa",
    [string]$MainUserId = "qa-full-01"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
$S3ImageBase = "https://doeventimageeventbucket.s3.us-east-1.amazonaws.com"
$now = (Get-Date).ToUniversalTime().ToString("o")
$expires = (Get-Date).ToUniversalTime().AddHours(24).ToString("o")

New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-DynamoItem($TableName, $Item) {
    $jsonPath = Join-Path $ItemsDir "$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 12 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
}

function Put-Client($User) {
    Put-DynamoItem $ClientTable @{
        id = @{ S = $User.Id }
        email = @{ S = $User.Email }
        user = @{ S = $User.Username }
        name = @{ S = $User.Name }
        lastName = @{ S = $User.LastName }
        phone = @{ S = $User.Phone }
        password = @{ S = $User.Password }
        userStatus = @{ S = "active" }
        createDate = @{ S = $now }
        indicativo = @{ S = "+57" }
        fotoPerfilUrl = @{ S = $User.AvatarKey }
        imagen = @{ S = "$S3ImageBase/$($User.AvatarKey)" }
        plan = @{ S = "free" }
        isPublicProfile = @{ BOOL = $true }
        calificacion = @{ N = [string]$User.Rating }
        eventosRealizados = @{ N = [string]$User.EventsDone }
        experiencia = @{ N = [string]$User.Experience }
        ciudad = @{ S = $User.City }
        departamento = @{ S = $User.State }
        pais = @{ S = "Colombia" }
        description = @{ S = $User.Bio }
        latitude = @{ N = [string]$User.Lat }
        longitude = @{ N = [string]$User.Lng }
    }
    Write-Host "  Usuario: $($User.Email)" -ForegroundColor Green
}

function Put-Event($ev) {
    $imageUrl = "$S3ImageBase/$($ev.ImageKey)"
    Put-DynamoItem $EventsTable @{
        id = @{ S = $ev.Id }
        userId = @{ S = $ev.UserId }
        nombre = @{ S = $ev.Name }
        descripcion = @{ S = $ev.Description }
        ciudad = @{ S = $ev.City }
        departamento = @{ S = $ev.State }
        pais = @{ S = "Colombia" }
        direccion = @{ S = $ev.Address }
        latitude = @{ N = [string]$ev.Lat }
        longitude = @{ N = [string]$ev.Lng }
        ubicacion = @{
            M = @{
                latitude = @{ N = [string]$ev.Lat }
                longitude = @{ N = [string]$ev.Lng }
                city = @{ S = $ev.City }
                state = @{ S = $ev.State }
                country = @{ S = "Colombia" }
                address = @{ S = $ev.Address }
            }
        }
        fechaIni = @{ S = $ev.DateIni }
        fechaFin = @{ S = $ev.DateIni }
        horaIni = @{ S = $ev.HourIni }
        horaFin = @{ S = $ev.HourFin }
        Categoria = @{ S = $ev.Category }
        tipoEvento = @{ S = "1117" }
        tipoLugar = @{ S = "1037" }
        clase = @{ S = "Public" }
        estatus = @{ S = "activo" }
        modalidadEvt = @{ S = "P" }
        aforo = @{ S = "120" }
        avaliableCapacity = @{ S = "120" }
        calificacion = @{ N = "0" }
        currency = @{ S = "COP" }
        categoriaReembolso = @{ S = "7" }
        organizerName = @{ S = $ev.OrganizerName }
        email = @{ S = $ev.Email }
        slug = @{ S = ($ev.Id -replace '[^a-z0-9-]', '') }
        createDate = @{ S = $now }
        publishAt = @{ S = $now }
        updatedAt = @{ S = $now }
        timezone = @{ S = "America/Bogota" }
        skipVenue = @{ BOOL = $false }
        imagen = @{ S = $imageUrl }
        Hashtags = @{ L = @() }
        entranceData = @{ L = @() }
    }
    Put-DynamoItem $ImagesTable @{
        id = @{ S = "img-$($ev.Id)" }
        id_evento = @{ S = $ev.Id }
        id_user = @{ S = $ev.UserId }
        id_imagen = @{ S = $ev.ImageKey }
        imagenesCargadas = @{ L = @(@{ S = $imageUrl }) }
    }
}

function Put-Story($story) {
    $mediaUrl = if ($story.ImageKey) { "$S3ImageBase/$($story.ImageKey)" } else { $null }
    $mediaList = if ($mediaUrl) {
        @{ L = @(@{
            M = @{
                url = @{ S = $mediaUrl }
                kind = @{ S = $story.MediaKind }
                contentType = @{ S = if ($story.MediaKind -eq "video") { "video/mp4" } else { "image/jpeg" } }
            }
        }) }
    } else { @{ L = @() } }

    Put-DynamoItem $StoriesTable @{
        id = @{ S = $story.Id }
        type = @{ S = "story" }
        authorId = @{ S = $story.AuthorId }
        title = @{ S = "" }
        description = @{ S = $story.Description }
        media = $mediaList
        visibility = @{ S = "PUBLIC" }
        isRepost = @{ BOOL = $false }
        likesCount = @{ N = "0" }
        commentsCount = @{ N = "0" }
        repostsCount = @{ N = "0" }
        sharesCount = @{ N = "0" }
        locationLabel = @{ S = $story.LocationLabel }
        createdAt = @{ S = $now }
        updatedAt = @{ S = $now }
        expiresAt = @{ S = $expires }
        sortKey = @{ S = "$now#$($story.Id)" }
        isLive = @{ BOOL = $story.IsLive }
        mediaKind = @{ S = $story.MediaKind }
        latitude = @{ N = [string]$story.Lat }
        longitude = @{ N = [string]$story.Lng }
    }
}

function Put-DirectChat($roomId, $userA, $userB, $messages) {
    Put-DynamoItem $ChatsTable @{
        id = @{ S = "qa-chat-$roomId" }
        updatedAt = @{ S = $now }
        roomId = @{ S = $roomId }
        createdAt = @{ S = $now }
        target = @{ L = @(@{ S = "room::direct" }) }
        participants = @{ L = @(@{ S = $userA }, @{ S = $userB }) }
        adminId = @{ L = @(@{ S = $userA }) }
        administrators = @{ L = @(@{ S = $userA }) }
        blacklist = @{ L = @() }
        messages = @{ L = @() }
    }
    $i = 0
    foreach ($msg in $messages) {
        $i++
        $ts = (Get-Date).ToUniversalTime().AddMinutes(-60 + ($i * 5)).ToString("o")
        Put-DynamoItem $MessagesTable @{
            id = @{ S = "qa-comm-msg-$roomId-$i" }
            createdAt = @{ S = $ts }
            updatedAt = @{ S = $ts }
            roomId = @{ S = $roomId }
            sender = @{ S = $msg.Sender }
            text = @{ S = $msg.Text }
            status = @{ S = "active" }
            type = @{ S = "message-text" }
            reactions = @{ L = @() }
            reads = @{ L = @(@{ S = $msg.Sender }) }
        }
    }
}

$users = @(
    @{
        Id = "qa-comm-01"; Email = "maria.eventos@doeventsapp.com"; Username = "maria_eventos"
        Name = "Maria"; LastName = "Rodriguez"; Phone = "+573001220001"; Password = "QaComm123!"
        AvatarKey = "cumpleaños.jpeg"; Rating = 4.8; EventsDone = 12; Experience = 12
        City = "Girardot"; State = "Cundinamarca"; Lat = 4.3012; Lng = -74.8011
        Bio = "Organizadora de eventos familiares y picnics en el Magdalena. +5 años de experiencia."
    },
    @{
        Id = "qa-comm-02"; Email = "carlos.live@doeventsapp.com"; Username = "carlos_live"
        Name = "Carlos"; LastName = "Mendoza"; Phone = "+573001220002"; Password = "QaComm123!"
        AvatarKey = "stand-comedy.jpeg"; Rating = 4.5; EventsDone = 8; Experience = 8
        City = "Melgar"; State = "Tolima"; Lat = 4.2045; Lng = -74.6402
        Bio = "Productor de shows en vivo y stand up. Especialista en eventos nocturnos."
    },
    @{
        Id = "qa-comm-03"; Email = "laura.cultura@doeventsapp.com"; Username = "laura_cultura"
        Name = "Laura"; LastName = "Vargas"; Phone = "+573001220003"; Password = "QaComm123!"
        AvatarKey = "bambuco.jpeg"; Rating = 4.9; EventsDone = 15; Experience = 15
        City = "Fusagasuga"; State = "Cundinamarca"; Lat = 4.3368; Lng = -74.3638
        Bio = "Curadora cultural. Ferias, arte y gastronomia regional."
    },
    @{
        Id = "qa-comm-04"; Email = "andres.music@doeventsapp.com"; Username = "andres_music"
        Name = "Andres"; LastName = "Silva"; Phone = "+573001220004"; Password = "QaComm123!"
        AvatarKey = "cine-al-parque.jpeg"; Rating = 4.6; EventsDone = 6; Experience = 6
        City = "Bogota"; State = "Cundinamarca"; Lat = 4.6211; Lng = -74.0672
        Bio = "DJ y organizador de conciertos al aire libre en Bogota."
    }
)

Write-Host "=== Sembrando usuarios de comunidad QA ===" -ForegroundColor Cyan
foreach ($u in $users) { Put-Client $u }

Write-Host "=== Sembrando eventos ===" -ForegroundColor Cyan
$events = @(
    @{ Id = "qa-comm-ev-001"; UserId = "qa-comm-01"; Name = "Picnic Sunset Girardot"; Description = "Tarde familiar con musica en vivo junto al rio."
       City = "Girardot"; State = "Cundinamarca"; Address = "Malecon Girardot"; Lat = 4.3012; Lng = -74.8011
       DateIni = "20260620"; HourIni = "04:00 P. M."; HourFin = "09:00 P. M."; Category = "1001"
       ImageKey = "cumpleaños.jpeg"; OrganizerName = "Maria Rodriguez"; Email = "maria.eventos@doeventsapp.com" },
    @{ Id = "qa-comm-ev-002"; UserId = "qa-comm-02"; Name = "Comedy Night Melgar"; Description = "Stand up con artistas de la region."
       City = "Melgar"; State = "Tolima"; Address = "Centro Melgar"; Lat = 4.2045; Lng = -74.6402
       DateIni = "20260621"; HourIni = "08:00 P. M."; HourFin = "11:00 P. M."; Category = "1010"
       ImageKey = "stand-comedy.jpeg"; OrganizerName = "Carlos Mendoza"; Email = "carlos.live@doeventsapp.com" },
    @{ Id = "qa-comm-ev-003"; UserId = "qa-comm-03"; Name = "Feria Gastronomica Fusa"; Description = "Sabores del Sumapaz y artesanos locales."
       City = "Fusagasuga"; State = "Cundinamarca"; Address = "Plaza de Bolivar"; Lat = 4.3368; Lng = -74.3638
       DateIni = "20260622"; HourIni = "10:00 A. M."; HourFin = "06:00 P. M."; Category = "1008"
       ImageKey = "bambuco.jpeg"; OrganizerName = "Laura Vargas"; Email = "laura.cultura@doeventsapp.com" },
    @{ Id = "qa-comm-ev-004"; UserId = "qa-comm-04"; Name = "Open Air Sessions Bogota"; Description = "Concierto electronico al atardecer."
       City = "Bogota"; State = "Cundinamarca"; Address = "Parque Simon Bolivar"; Lat = 4.6211; Lng = -74.0672
       DateIni = "20260623"; HourIni = "05:00 P. M."; HourFin = "10:00 P. M."; Category = "1005"
       ImageKey = "cine-al-parque.jpeg"; OrganizerName = "Andres Silva"; Email = "andres.music@doeventsapp.com" },
    @{ Id = "qa-comm-ev-005"; UserId = "qa-comm-01"; Name = "Torneo Recreativo Rio"; Description = "Competencias acuaticas y zona food trucks."
       City = "Girardot"; State = "Cundinamarca"; Address = "Club Nautico"; Lat = 4.2988; Lng = -74.8088
       DateIni = "20260624"; HourIni = "09:00 A. M."; HourFin = "04:00 P. M."; Category = "1006"
       ImageKey = "SanJuanero.jpeg"; OrganizerName = "Maria Rodriguez"; Email = "maria.eventos@doeventsapp.com" }
)
foreach ($ev in $events) { Put-Event $ev; Write-Host "  Evento: $($ev.Name)" -ForegroundColor DarkGreen }

Write-Host "=== Sembrando historias (24h) ===" -ForegroundColor Cyan
$stories = @(
    @{ Id = "qa-story-001"; AuthorId = "qa-comm-01"; Description = "Preparando el picnic de hoy en Girardot"; ImageKey = "cumpleaños.jpeg"; MediaKind = "image"; IsLive = $false; Lat = 4.3012; Lng = -74.8011; LocationLabel = "Girardot, Cundinamarca" },
    @{ Id = "qa-story-002"; AuthorId = "qa-comm-02"; Description = "En vivo desde el soundcheck"; ImageKey = "stand-comedy.jpeg"; MediaKind = "image"; IsLive = $true; Lat = 4.2045; Lng = -74.6402; LocationLabel = "Melgar, Tolima" },
    @{ Id = "qa-story-003"; AuthorId = "qa-comm-03"; Description = "Probando platos para la feria"; ImageKey = "bambuco.jpeg"; MediaKind = "image"; IsLive = $false; Lat = 4.3368; Lng = -74.3638; LocationLabel = "Fusagasuga" },
    @{ Id = "qa-story-004"; AuthorId = "qa-comm-04"; Description = "Hoy tocamos al aire libre"; ImageKey = "cine-al-parque.jpeg"; MediaKind = "image"; IsLive = $true; Lat = 4.6211; Lng = -74.0672; LocationLabel = "Bogota" },
    @{ Id = "qa-story-005"; AuthorId = "qa-comm-01"; Description = "Estado: lista de invitados confirmada"; ImageKey = $null; MediaKind = "text"; IsLive = $false; Lat = 4.3012; Lng = -74.8011; LocationLabel = "Girardot" }
)
foreach ($s in $stories) { Put-Story $s; Write-Host "  Historia: $($s.Id)" -ForegroundColor DarkGreen }

Write-Host "=== Sembrando chats con qa-full-01 ===" -ForegroundColor Cyan
Put-DirectChat "qa-comm-chat-maria" $MainUserId "qa-comm-01" @(
    @{ Sender = "qa-comm-01"; Text = "Hola Tatiana! Te invito al picnic del malecon este sabado." },
    @{ Sender = $MainUserId; Text = "Gracias Maria, me interesa. A que hora abren puertas?" },
    @{ Sender = "qa-comm-01"; Text = "A las 4 PM. Te envio la ubicacion por aqui." }
)
Put-DirectChat "qa-comm-chat-carlos" $MainUserId "qa-comm-02" @(
    @{ Sender = "qa-comm-02"; Text = "Tatiana, quedan pocas entradas para Comedy Night." },
    @{ Sender = $MainUserId; Text = "Reservame dos por favor." }
)
Put-DirectChat "qa-comm-chat-laura" "qa-comm-03" $MainUserId @(
    @{ Sender = "qa-comm-03"; Text = "Hola! Quieres ser patrocinadora de la feria gastronomica?" },
    @{ Sender = $MainUserId; Text = "Cuentame mas sobre los paquetes." }
)

Write-Host ""
Write-Host "=== Credenciales usuarios de comunidad ===" -ForegroundColor Yellow
foreach ($u in $users) {
    Write-Host "  $($u.Email) / $($u.Password)  (@$($u.Username))"
}
Write-Host ""
Write-Host "Usuario principal de pruebas: qa-full@doeventsapp.com / QaTest123!" -ForegroundColor Cyan
Write-Host "Seed completado." -ForegroundColor Green

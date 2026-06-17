# Seed eventos demo QA: recomendados, propios, favoritos y otros + imagenes + favoritos
param(
    [string]$Region = "us-east-2",
    [string]$EventsTable = "Eventos-qa",
    [string]$ImagesTable = "imagenes-qa",
    [string]$FavTable = "userFavoriteEvents-qa",
    [string]$OrganizerUserId = "qa-full-01"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
$S3ImageBase = "https://doeventimageeventbucket.s3.us-east-1.amazonaws.com"
$now = (Get-Date).ToUniversalTime().ToString("o")

New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-DynamoItem($TableName, $Item) {
    $jsonPath = Join-Path $ItemsDir "$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 10 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
}

function New-EventItem($ev) {
    $ownerId = if ($ev.userId) { $ev.userId } else { $OrganizerUserId }
    $fechaFin = if ($ev.fechaFin) { $ev.fechaFin } else { $ev.fechaIni }
    $tipoLugar = if ($ev.tipoLugar) { $ev.tipoLugar } else { "1037" }
    $imageUrl = "$S3ImageBase/$($ev.imagenKey)"
    $hashtagList = @($ev.hashtags | ForEach-Object { @{ S = $_ } })
    return @{
        id = @{ S = $ev.id }
        userId = @{ S = $ownerId }
        nombre = @{ S = $ev.nombre }
        descripcion = @{ S = $ev.descripcion }
        ciudad = @{ S = $ev.ciudad }
        departamento = @{ S = $ev.departamento }
        pais = @{ S = "Colombia" }
        direccion = @{ S = $ev.direccion }
        latitude = @{ N = [string]$ev.latitude }
        longitude = @{ N = [string]$ev.longitude }
        ubicacion = @{
            M = @{
                latitude = @{ N = [string]$ev.latitude }
                longitude = @{ N = [string]$ev.longitude }
                city = @{ S = $ev.ciudad }
                state = @{ S = $ev.departamento }
                country = @{ S = "Colombia" }
                address = @{ S = $ev.direccion }
            }
        }
        fechaIni = @{ S = $ev.fechaIni }
        fechaFin = @{ S = $fechaFin }
        horaIni = @{ S = $ev.horaIni }
        horaFin = @{ S = $ev.horaFin }
        Categoria = @{ S = $ev.Categoria }
        tipoEvento = @{ S = $ev.tipoEvento }
        tipoLugar = @{ S = $tipoLugar }
        clase = @{ S = "Public" }
        estatus = @{ S = "activo" }
        modalidadEvt = @{ S = "P" }
        aforo = @{ S = "150" }
        avaliableCapacity = @{ S = "150" }
        calificacion = @{ N = "0" }
        currency = @{ S = "COP" }
        categoriaReembolso = @{ S = "7" }
        organizerName = @{ S = "Tatiana Completo QA" }
        email = @{ S = "qa-full@doeventsapp.com" }
        TelPrin = @{ S = "3001110002" }
        IndicativoTelPrinOrg = @{ S = "+57" }
        slug = @{ S = ($ev.id -replace '[^a-z0-9-]', '') }
        createDate = @{ S = $now }
        publishAt = @{ S = $now }
        updatedAt = @{ S = $now }
        timezone = @{ S = "America/Bogota" }
        skipVenue = @{ BOOL = $false }
        imagen = @{ S = $imageUrl }
        Hashtags = @{ L = $hashtagList }
        entranceData = @{ L = @() }
    }
}

function Seed-Event($ev) {
    $ownerId = if ($ev.userId) { $ev.userId } else { $OrganizerUserId }
    Put-DynamoItem $EventsTable (New-EventItem $ev)
    $imageUrl = "$S3ImageBase/$($ev.imagenKey)"
    Put-DynamoItem $ImagesTable @{
        id = @{ S = "img-$($ev.id)" }
        id_evento = @{ S = $ev.id }
        id_user = @{ S = $ownerId }
        id_imagen = @{ S = $ev.imagenKey }
        imagenesCargadas = @{ L = @(@{ S = $imageUrl }) }
    }
}

function Seed-Favorite($eventId) {
    Put-DynamoItem $FavTable @{
        userId = @{ S = $OrganizerUserId }
        eventId = @{ S = $eventId }
        timestamp = @{ S = $now }
    }
}

$events = @(
    @{
        id = "qa-demo-own-001"; section = "own"
        nombre = "Festival QA Creado por Mi"
        descripcion = "Evento creado por qa-full para probar la seccion Mis eventos. Incluye musica, food trucks y zona familiar."
        ciudad = "Girardot"; departamento = "Cundinamarca"; direccion = "Parque San Antonio, Girardot"
        latitude = 4.2998; longitude = -74.7995
        fechaIni = "20260701"; horaIni = "04:00 P. M."; horaFin = "10:00 P. M."
        Categoria = "1001"; tipoEvento = "1117"; imagenKey = "SanJuanero.jpeg"
        hashtags = @("#MisEventos", "#Girardot", "#QA")
    },
    @{
        id = "qa-demo-own-002"; section = "own"
        nombre = "Workshop DoEvents QA"
        descripcion = "Taller de creacion de eventos en la plataforma. Evento propio del usuario de prueba con toda la ficha completa."
        ciudad = "Bogota"; departamento = "Cundinamarca"; direccion = "Carrera 7 # 32-16, Bogota"
        latitude = 4.621; longitude = -74.067
        fechaIni = "20260708"; horaIni = "09:00 A. M."; horaFin = "01:00 P. M."
        Categoria = "1015"; tipoEvento = "1115"; imagenKey = "conferencia.jpeg"
        hashtags = @("#Workshop", "#DoEvents", "#QA")
    },
    @{
        id = "qa-demo-rec-001"; section = "recommended"
        nombre = "Picnic Familiar en el Parque"
        descripcion = "Jornada familiar con juegos, mercado campesino y actividades para ninos. Recomendado por gustos de Familia."
        ciudad = "Girardot"; departamento = "Cundinamarca"; direccion = "Parque de la Igua, Girardot"
        latitude = 4.292; longitude = -74.805
        fechaIni = "20260622"; horaIni = "10:00 A. M."; horaFin = "05:00 P. M."
        Categoria = "1001"; tipoEvento = "1102"; imagenKey = "cumpleaños.jpeg"
        hashtags = @("#Familia", "#Picnic", "#Girardot"); userId = "qa-gust-01"
    },
    @{
        id = "qa-demo-rec-002"; section = "recommended"
        nombre = "Cine al Parque Bogota"
        descripcion = "Proyeccion al aire libre con peliculas colombianas. Recomendado por gusto de Cine y entretenimiento."
        ciudad = "Bogota"; departamento = "Cundinamarca"; direccion = "Parque El Tunal, Bogota"
        latitude = 4.576; longitude = -74.145
        fechaIni = "20260629"; horaIni = "06:00 P. M."; horaFin = "10:00 P. M."
        Categoria = "1005"; tipoEvento = "1105"; imagenKey = "cine-al-parque.jpeg"
        hashtags = @("#Cine", "#Bogota", "#QA"); userId = "qa-gust-01"
    },
    @{
        id = "qa-demo-rec-003"; section = "recommended"
        nombre = "Stand Up Comedy Night"
        descripcion = "Noche de comedia en vivo con artistas locales. Recomendado por gustos de Artes escenicas."
        ciudad = "Melgar"; departamento = "Tolima"; direccion = "Centro de Convenciones, Melgar"
        latitude = 4.203; longitude = -74.639
        fechaIni = "20260703"; horaIni = "08:00 P. M."; horaFin = "10:30 P. M."
        Categoria = "1010"; tipoEvento = "1106"; imagenKey = "stand-comedy.jpeg"
        hashtags = @("#Comedia", "#Melgar", "#QA"); userId = "qa-gust-01"
    },
    @{
        id = "qa-demo-other-001"; section = "other"
        nombre = "Expo Automotriz Bogota"
        descripcion = "Exposicion de vehiculos clasicos y nuevos modelos. Evento activo fuera de tus gustos principales."
        ciudad = "Bogota"; departamento = "Cundinamarca"; direccion = "Corferias, Bogota"
        latitude = 4.628; longitude = -74.089
        fechaIni = "20260710"; horaIni = "10:00 A. M."; horaFin = "07:00 P. M."
        Categoria = "1004"; tipoEvento = "1119"; imagenKey = "conferencia.jpeg"
        hashtags = @("#Autos", "#Expo", "#Bogota"); userId = "qa-gust-01"
    },
    @{
        id = "qa-demo-other-002"; section = "other"
        nombre = "Feria del Libro Regional"
        descripcion = "Encuentro de editoriales, firmas de libros y actividades culturales en Fusagasuga."
        ciudad = "Fusagasuga"; departamento = "Cundinamarca"; direccion = "Plaza de Bolivar, Fusagasuga"
        latitude = 4.337; longitude = -74.362
        fechaIni = "20260715"; horaIni = "09:00 A. M."; horaFin = "06:00 P. M."
        Categoria = "1002"; tipoEvento = "1117"; imagenKey = "bambuco.jpeg"
        hashtags = @("#Libros", "#Cultura", "#Fusagasuga"); userId = "qa-gust-01"
    }
)

Write-Host "=== Seed eventos demo QA ===" -ForegroundColor Cyan
foreach ($ev in $events) {
    Seed-Event $ev
    Write-Host "  Evento [$($ev.section)]: $($ev.nombre)" -ForegroundColor Green
}

$favorites = @(
    "qa-map-girardot-002",
    "qa-map-melgar-009",
    "qa-demo-rec-002"
)
Write-Host "=== Seed favoritos qa-full-01 ===" -ForegroundColor Cyan
foreach ($favId in $favorites) {
    Seed-Favorite $favId
    Write-Host "  Favorito: $favId" -ForegroundColor DarkGreen
}

Write-Host "=== Seed demo completado ===" -ForegroundColor Green

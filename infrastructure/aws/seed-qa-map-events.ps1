# Seed eventos QA cerca de Girardot, Fusagasuga, Bogota y Melgar (+ imagenes-qa)
param(
    [string]$Region = "us-east-2",
    [string]$EventsTable = "Eventos-qa",
    [string]$ImagesTable = "imagenes-qa",
    [string]$OrganizerUserId = "qa-full-01"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
$S3ImageBase = "https://doeventimageeventbucket.s3.us-east-1.amazonaws.com"

New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-DynamoItem($TableName, $Item) {
    $jsonPath = Join-Path $ItemsDir "$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 8 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
}

$events = @(
    @{
        id = "qa-map-girardot-001"
        nombre = "Torneo de Futbol en Girardot"
        descripcion = "Partidos amistosos junto al Rio Magdalena. Incluye hidratacion, arbitraje y premiacion para categorias infantil y adulto. Ideal para probar el mapa y el detalle del evento en QA."
        ciudad = "Girardot"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Malecon del Rio Magdalena, Girardot"
        latitude = 4.2985
        longitude = -74.7885
        fechaIni = "20260610"
        fechaFin = "20260610"
        horaIni = "08:00 A. M."
        horaFin = "12:00 P. M."
        Categoria = "1017"
        tipoEvento = "1120"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "carrera-deportiva.jpeg"
        hashtags = @("#Girardot", "#Futbol", "#Magdalena")
    },
    @{
        id = "qa-map-girardot-002"
        nombre = "Festival Gastronomico Girardot"
        descripcion = "Muestra de platos tipicos del Magdalena medio, postres artesanales y musica en vivo frente al malecon. Entrada libre con cupos limitados para degustaciones guiadas."
        ciudad = "Girardot"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Plaza de Mercado Central, Girardot"
        latitude = 4.3012
        longitude = -74.8018
        fechaIni = "20260615"
        fechaFin = "20260615"
        horaIni = "10:00 A. M."
        horaFin = "06:00 P. M."
        Categoria = "1012"
        tipoEvento = "1117"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "catacion.jpeg"
        hashtags = @("#Girardot", "#Gastronomia", "#Magdalena")
    },
    @{
        id = "qa-map-ricaurte-003"
        nombre = "Concierto al Atardecer Ricaurte"
        descripcion = "Noche de musica popular y crossover en ambiente campestre. Food trucks, zona picnic y parqueadero gratuito. Perfecto para validar eventos fuera de la ciudad principal."
        ciudad = "Ricaurte"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Vereda El Triunfo, Ricaurte"
        latitude = 4.2855
        longitude = -74.7720
        fechaIni = "20260620"
        fechaFin = "20260620"
        horaIni = "05:00 P. M."
        horaFin = "09:00 P. M."
        Categoria = "1009"
        tipoEvento = "1105"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "concierto-gratuito.jpeg"
        hashtags = @("#Ricaurte", "#Musica", "#Atardecer")
    },
    @{
        id = "qa-map-bogota-004"
        nombre = "Bogota Digitos 2026"
        descripcion = "Conferencia de marketing digital, growth y automatizacion para emprendedores. Talleres practicos, networking y certificado de asistencia. Evento corporativo de prueba en Bogota."
        ciudad = "Bogota"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Ac. 24 #38-47, Bogota"
        latitude = 4.6372
        longitude = -74.0836
        fechaIni = "20260619"
        fechaFin = "20260619"
        horaIni = "09:00 A. M."
        horaFin = "06:00 P. M."
        Categoria = "1016"
        tipoEvento = "1107"
        tipoLugar = "1028"
        clase = "Public"
        imagenKey = "conferencia.jpeg"
        hashtags = @("#Bogota", "#Marketing", "#Tecnologia")
    },
    @{
        id = "qa-map-bogota-005"
        nombre = "Tropipop En Vivo Bogota"
        descripcion = "Concierto con artistas nacionales de musica urbana y tropical. Escenario principal, zona VIP y servicio de transporte sugerido desde el centro. Evento activo para pruebas de detalle y checkout."
        ciudad = "Bogota"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Movistar Arena, Bogota"
        latitude = 4.6533
        longitude = -74.0836
        fechaIni = "20260705"
        fechaFin = "20260705"
        horaIni = "08:00 P. M."
        horaFin = "11:30 P. M."
        Categoria = "1009"
        tipoEvento = "1105"
        tipoLugar = "1042"
        clase = "Public"
        imagenKey = "concierto.jpeg"
        hashtags = @("#Bogota", "#Tropipop", "#Concierto")
    },
    @{
        id = "qa-map-fusagasuga-006"
        nombre = "Feria Artesanal Fusagasuga"
        descripcion = "Exposicion de artesanias del Sumapaz, talleres para ninos y muestras gastronomicas locales. Parque principal ambientado para recorrer stands y comprar productos regionales."
        ciudad = "Fusagasuga"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Parque Principal, Fusagasuga"
        latitude = 4.3365
        longitude = -74.3638
        fechaIni = "20260625"
        fechaFin = "20260625"
        horaIni = "10:00 A. M."
        horaFin = "07:00 P. M."
        Categoria = "1002"
        tipoEvento = "1117"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "bambuco.jpeg"
        hashtags = @("#Fusagasuga", "#Artesanias", "#Feria")
    },
    @{
        id = "qa-map-fusagasuga-007"
        nombre = "Carrera Nocturna Fusagasuga"
        descripcion = "Carrera 5K nocturna por el centro historico con cronometraje chip, hidratacion cada kilometro y medalla finisher. Categorias elite, recreativa y caminata familiar."
        ciudad = "Fusagasuga"
        departamento = "Cundinamarca"
        pais = "Colombia"
        direccion = "Calle 8 con Carrera 6, Fusagasuga"
        latitude = 4.3388
        longitude = -74.3610
        fechaIni = "20260712"
        fechaFin = "20260712"
        horaIni = "07:00 P. M."
        horaFin = "10:00 P. M."
        Categoria = "1017"
        tipoEvento = "1121"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "carreras-ciclistas-urbanas.jpeg"
        hashtags = @("#Fusagasuga", "#Running", "#5K")
    },
    @{
        id = "qa-map-melgar-008"
        nombre = "Pool Party Melgar"
        descripcion = "Fiesta en piscina con DJ, cocteleria sin alcohol para menores y zona lounge. Ambiente vacacional tipico del Eje Cafetero para probar eventos en Melgar desde el mapa."
        ciudad = "Melgar"
        departamento = "Tolima"
        pais = "Colombia"
        direccion = "Via Boqueron, Melgar"
        latitude = 4.2047
        longitude = -74.6408
        fechaIni = "20260628"
        fechaFin = "20260628"
        horaIni = "02:00 P. M."
        horaFin = "10:00 P. M."
        Categoria = "1005"
        tipoEvento = "1102"
        tipoLugar = "1037"
        clase = "Public"
        imagenKey = "estereo-picnic.jpeg"
        hashtags = @("#Melgar", "#PoolParty", "#FinDeSemana")
    },
    @{
        id = "qa-map-melgar-009"
        nombre = "Comedia en Vivo Melgar"
        descripcion = "Stand-up comedy con comediantes nacionales en fin de semana largo. Dos funciones, consumo en sitio y sorteos para la audiencia. Evento cultural para validar imagenes y ficha completa."
        ciudad = "Melgar"
        departamento = "Tolima"
        pais = "Colombia"
        direccion = "Centro Comercial El Penon, Melgar"
        latitude = 4.2010
        longitude = -74.6380
        fechaIni = "20260718"
        fechaFin = "20260718"
        horaIni = "09:00 P. M."
        horaFin = "11:00 P. M."
        Categoria = "1010"
        tipoEvento = "1106"
        tipoLugar = "1042"
        clase = "Public"
        imagenKey = "stand-comedy.jpeg"
        hashtags = @("#Melgar", "#Comedia", "#StandUp")
    }
)

Write-Host "=== Seed eventos mapa QA ($EventsTable + $ImagesTable) ===" -ForegroundColor Cyan

foreach ($ev in $events) {
    $now = (Get-Date).ToUniversalTime().ToString("o")
    $imageUrl = "$S3ImageBase/$($ev.imagenKey)"
    $hashtagList = @($ev.hashtags | ForEach-Object { @{ S = $_ } })

    $item = @{
        id = @{ S = $ev.id }
        userId = @{ S = $OrganizerUserId }
        nombre = @{ S = $ev.nombre }
        descripcion = @{ S = $ev.descripcion }
        ciudad = @{ S = $ev.ciudad }
        departamento = @{ S = $ev.departamento }
        pais = @{ S = $ev.pais }
        direccion = @{ S = $ev.direccion }
        latitude = @{ N = [string]$ev.latitude }
        longitude = @{ N = [string]$ev.longitude }
        ubicacion = @{
            M = @{
                latitude = @{ N = [string]$ev.latitude }
                longitude = @{ N = [string]$ev.longitude }
                city = @{ S = $ev.ciudad }
                state = @{ S = $ev.departamento }
                country = @{ S = $ev.pais }
                address = @{ S = $ev.direccion }
            }
        }
        fechaIni = @{ S = $ev.fechaIni }
        fechaFin = @{ S = $ev.fechaFin }
        horaIni = @{ S = $ev.horaIni }
        horaFin = @{ S = $ev.horaFin }
        Categoria = @{ S = $ev.Categoria }
        tipoEvento = @{ S = $ev.tipoEvento }
        tipoLugar = @{ S = $ev.tipoLugar }
        clase = @{ S = $ev.clase }
        estatus = @{ S = "activo" }
        modalidadEvt = @{ S = "P" }
        aforo = @{ S = "200" }
        avaliableCapacity = @{ S = "200" }
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

    Put-DynamoItem $EventsTable $item
    Write-Host "  Evento: $($ev.nombre) ($($ev.ciudad))" -ForegroundColor Green

    $imageItem = @{
        id = @{ S = "img-$($ev.id)" }
        id_evento = @{ S = $ev.id }
        id_user = @{ S = $OrganizerUserId }
        id_imagen = @{ S = $ev.imagenKey }
        imagenesCargadas = @{
            L = @(
                @{ S = $imageUrl }
            )
        }
    }
    Put-DynamoItem $ImagesTable $imageItem
    Write-Host "  Imagen: $($ev.imagenKey)" -ForegroundColor DarkGreen
}

Write-Host "=== Seed completado: $($events.Count) eventos + imagenes ===" -ForegroundColor Green

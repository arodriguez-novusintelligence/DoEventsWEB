# Seed proveedores de servicios QA (perfiles Lovable + usuarios comunidad)
param(
    [string]$Region = "us-east-2",
    [string]$ServicesTable = "ServiceProviders-qa"
)

$ErrorActionPreference = "Stop"
$ItemsDir = Join-Path $PSScriptRoot "seed-data"
$S3ImageBase = "https://doeventimageeventbucket.s3.us-east-1.amazonaws.com"
$now = (Get-Date).ToUniversalTime().ToString("o")

New-Item -ItemType Directory -Force -Path $ItemsDir | Out-Null

function Put-DynamoItem($TableName, $Item) {
    $jsonPath = Join-Path $ItemsDir "$TableName-$([Guid]::NewGuid().ToString('N')).json"
    $json = $Item | ConvertTo-Json -Depth 8 -Compress
    [System.IO.File]::WriteAllText($jsonPath, $json, (New-Object System.Text.UTF8Encoding $false))
    aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($jsonPath -replace '\\','/')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "put-item fallo en $TableName" }
}

function Put-Service($s) {
    Put-DynamoItem $ServicesTable @{
        serviceId = @{ S = $s.ServiceId }
        userId = @{ S = $s.UserId }
        name = @{ S = $s.Name }
        role = @{ S = $s.Role }
        category = @{ S = $s.Category }
        description = @{ S = $s.Description }
        rating = @{ N = [string]$s.Rating }
        reviewCount = @{ N = [string]$s.ReviewCount }
        username = @{ S = $s.Username }
        profileImageUrl = @{ S = $s.ProfileImageUrl }
        latitude = @{ N = [string]$s.Lat }
        longitude = @{ N = [string]$s.Lng }
        city = @{ S = $s.City }
        status = @{ S = "active" }
        createdAt = @{ S = $now }
    }
    Write-Host "  Servicio: $($s.Name) ($($s.Role))" -ForegroundColor Green
}

$providers = @(
    @{
        ServiceId = "sp-qa-01"; UserId = "qa-comm-04"; Name = "Daniel Arroyave"; Role = "Cantante"
        Category = "musica"; Description = "Cantante profesional para eventos corporativos y sociales."
        Rating = 5.0; ReviewCount = 42; Username = "darromel"
        ProfileImageUrl = "$S3ImageBase/cine-al-parque.jpeg"
        Lat = 4.6211; Lng = -74.0672; City = "Bogota"
    },
    @{
        ServiceId = "sp-qa-02"; UserId = "qa-comm-02"; Name = "Carlos Martínez"; Role = "Fotógrafo"
        Category = "fotografia"; Description = "Fotografía profesional de eventos, bodas y conciertos."
        Rating = 5.0; ReviewCount = 38; Username = "carlosphoto"
        ProfileImageUrl = "$S3ImageBase/stand-comedy.jpeg"
        Lat = 4.2045; Lng = -74.6402; City = "Melgar"
    },
    @{
        ServiceId = "sp-qa-03"; UserId = "qa-comm-03"; Name = "Laura Gómez"; Role = "Diseñadora"
        Category = "diseno"; Description = "Diseño visual, branding y material gráfico para eventos."
        Rating = 4.9; ReviewCount = 27; Username = "lauradg"
        ProfileImageUrl = "$S3ImageBase/bambuco.jpeg"
        Lat = 4.3368; Lng = -74.3638; City = "Fusagasuga"
    },
    @{
        ServiceId = "sp-qa-04"; UserId = "qa-comm-01"; Name = "María Rivera"; Role = "Chef Catering"
        Category = "catering"; Description = "Catering gourmet y banquetes para eventos de hasta 500 personas."
        Rating = 4.8; ReviewCount = 55; Username = "chefmaria"
        ProfileImageUrl = "$S3ImageBase/cumpleaños.jpeg"
        Lat = 4.3012; Lng = -74.8011; City = "Girardot"
    },
    @{
        ServiceId = "sp-qa-05"; UserId = "qa-svc-05"; Name = "Miguel Torres"; Role = "DJ / Sonido"
        Category = "sonido"; Description = "DJ profesional, sonido e iluminación para fiestas y conciertos."
        Rating = 4.9; ReviewCount = 31; Username = "djmiguel"
        ProfileImageUrl = "$S3ImageBase/carrera-deportiva.jpeg"
        Lat = 4.6533; Lng = -74.0836; City = "Bogota"
    },
    @{
        ServiceId = "sp-qa-06"; UserId = "qa-svc-06"; Name = "Pedro Lara"; Role = "Logística"
        Category = "logistica"; Description = "Coordinación logística, montaje y desmontaje de eventos."
        Rating = 4.7; ReviewCount = 19; Username = "pedroevents"
        ProfileImageUrl = "$S3ImageBase/catacion.jpeg"
        Lat = 4.2985; Lng = -74.7885; City = "Girardot"
    },
    @{
        ServiceId = "sp-qa-07"; UserId = "qa-svc-07"; Name = "Isabel Cano"; Role = "Maestra de Ceremonia"
        Category = "presentacion"; Description = "Presentadora y maestra de ceremonias para eventos formales."
        Rating = 5.0; ReviewCount = 44; Username = "isabelmc"
        ProfileImageUrl = "$S3ImageBase/feria-artesanal.jpeg"
        Lat = 4.7109; Lng = -74.0721; City = "Bogota"
    },
    @{
        ServiceId = "sp-qa-08"; UserId = "qa-svc-08"; Name = "Ana Pérez"; Role = "Marketing"
        Category = "marketing"; Description = "Estrategia de marketing digital y difusión para eventos."
        Rating = 4.8; ReviewCount = 22; Username = "anamkt"
        ProfileImageUrl = "$S3ImageBase/arte-calle.jpeg"
        Lat = 4.6350; Lng = -74.0550; City = "Bogota"
    }
)

Write-Host "=== Sembrando proveedores de servicios QA ===" -ForegroundColor Cyan
foreach ($p in $providers) { Put-Service $p }
Write-Host "=== Seed servicios completado ($($providers.Count) proveedores) ===" -ForegroundColor Green

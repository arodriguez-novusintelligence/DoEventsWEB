# Usuario guía QA — perfil realista para demos y pruebas multi-usuario
param([string]$Region = "us-east-2")

$ErrorActionPreference = "Stop"
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$GuideId = "guia-doevents-01"

function Put-DynamoItem($TableName, $Item) {
  $file = Join-Path $env:TEMP "dynamo-seed-$TableName-$([Guid]::NewGuid().ToString('N')).json"
  $json = $Item | ConvertTo-Json -Depth 8 -Compress
  [System.IO.File]::WriteAllText($file, $json, [System.Text.UTF8Encoding]::new($false))
  aws dynamodb put-item --table-name $TableName --region $Region --item "file://$($file -replace '\\','/')" | Out-Null
  Remove-Item $file -ErrorAction SilentlyContinue
}

Write-Host "=== Usuario guía DoEvents QA ===" -ForegroundColor Cyan

Put-DynamoItem "Client-qa" @{
  id = @{ S = $GuideId }
  email = @{ S = "guia@doeventsapp.com" }
  user = @{ S = "valentina_guia" }
  name = @{ S = "Valentina" }
  lastName = @{ S = "Restrepo" }
  phone = @{ S = "+573108809900" }
  password = @{ S = "GuiaDemo2026!" }
  userStatus = @{ S = "active" }
  createDate = @{ S = $now }
  indicativo = @{ S = "+57" }
  fotoPerfilUrl = @{ S = "fotosPerfil/guia-valentina-perfil.jpg" }
  imagen = @{ S = "fotosPerfil/guia-valentina-perfil.jpg" }
  coverImageUrl = @{ S = "fotosPerfil/guia-valentina-cover.jpg" }
  plan = @{ S = "pro" }
  isPublicProfile = @{ BOOL = $true }
  calificacion = @{ N = "4.9" }
  eventosRealizados = @{ N = "12" }
  experiencia = @{ N = "3" }
  ciudad = @{ S = "Medellín" }
  departamento = @{ S = "Antioquia" }
  description = @{ S = "Organizadora de experiencias, conferencias y eventos corporativos en Antioquia. Te ayudo a descubrir todas las funciones de DoEvents." }
  bio = @{ S = "Organizadora de experiencias | Guía oficial DoEvents QA" }
  latitude = @{ N = "6.2442" }
  longitude = @{ N = "-75.5812" }
}

Put-DynamoItem "UserPreferences-qa" @{
  UserId = @{ S = $GuideId }
  Preferences = @{ L = @(@{ N = "1001" }, @{ N = "1005" }, @{ N = "1010" }, @{ N = "1015" }) }
  createdAt = @{ S = $now }
  updatedAt = @{ S = $now }
}

# Galería de perfil (tabla imagenes-qa si existe)
$galleryKeys = @(
  "fotosPerfil/guia-valentina-g1.jpg",
  "fotosPerfil/guia-valentina-g2.jpg",
  "fotosPerfil/guia-valentina-g3.jpg",
  "fotosPerfil/guia-valentina-g4.jpg"
)
foreach ($key in $galleryKeys) {
  try {
    Put-DynamoItem "imagenes-qa" @{
      id = @{ S = [Guid]::NewGuid().ToString() }
      id_usuario = @{ S = $GuideId }
      url = @{ S = $key }
      tipo = @{ S = "galeria" }
      createDate = @{ S = $now }
    }
  } catch {
    Write-Host "  (galería omitida si tabla imagenes-qa no existe)" -ForegroundColor DarkGray
  }
}

Write-Host ""
Write-Host "Usuario guía creado:" -ForegroundColor Green
Write-Host "  Email:    guia@doeventsapp.com"
Write-Host "  Usuario:  valentina_guia"
Write-Host "  Password: GuiaDemo2026!"
Write-Host "  ID:       $GuideId"
Write-Host ""
Write-Host "Usa este perfil como segundo usuario para probar chat, servicios, eventos y mapa." -ForegroundColor Yellow

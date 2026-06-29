# Carga variables VITE_* desde un .env para build (prioridad sobre .env.*.local vacios).
param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile
)

if (-not (Test-Path $EnvFile)) {
    Write-Warning "No existe env file: $EnvFile"
    return
}

Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    if (-not $name.StartsWith('VITE_')) { return }
    if ([string]::IsNullOrWhiteSpace($value)) { return }
    Set-Item -Path "env:$name" -Value $value
}

Write-Host "VITE vars loaded from $(Split-Path $EnvFile -Leaf)"

# Arranca el backend contra Supabase con los datos de supabase.env
# Uso:  .\correr-supabase.ps1   (desde la carpeta gymtrack-backend)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$archivo = Join-Path $PSScriptRoot 'supabase.env'
if (-not (Test-Path $archivo)) { throw "Falta supabase.env en $PSScriptRoot" }

foreach ($linea in Get-Content $archivo -Encoding UTF8) {
    $linea = $linea.Trim()
    if ($linea -eq '' -or $linea.StartsWith('#')) { continue }
    $i = $linea.IndexOf('=')
    if ($i -lt 1) { continue }
    $clave = $linea.Substring(0, $i).Trim()
    $valor = $linea.Substring($i + 1).Trim()
    Set-Item -Path "Env:$clave" -Value $valor
}

if (-not $env:DB_PASSWORD -or $env:DB_PASSWORD -like 'PONER-*') {
    throw 'Completá DB_PASSWORD en supabase.env'
}

Write-Host "Backend contra Supabase en http://localhost:$($env:PORT)" -ForegroundColor Green
& .\mvnw.cmd spring-boot:run

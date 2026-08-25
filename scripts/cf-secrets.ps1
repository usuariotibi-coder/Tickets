param(
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Error "No se encontro el archivo $EnvFile"
    exit 1
}

$secrets = @{}

Get-Content -LiteralPath $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    if (-not $line.Contains("=")) { return }
    $idx = $line.IndexOf("=")
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()

    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    $secrets[$key] = $value
}

if ($secrets.Count -eq 0) {
    Write-Error "No hay variables que subir en $EnvFile"
    exit 1
}

$json = $secrets | ConvertTo-Json -Depth 3
$tmp = Join-Path $env:TEMP "cf-secrets.json"
[System.IO.File]::WriteAllText($tmp, $json, [System.Text.Encoding]::UTF8)

Write-Host "Subiendo $($secrets.Count) secretos al worker 'asistente-ti'..."
npx wrangler secret bulk $tmp

Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
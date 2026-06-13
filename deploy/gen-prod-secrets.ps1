<#
.SYNOPSIS
  Generate fresh production secrets for the Souk ElKanto / CoreMesh stack.

.DESCRIPTION
  Outputs random secrets sized correctly for each use:
    - JWT_SECRET             48 bytes, base64url-encoded
    - KYC_ENCRYPTION_KEY     32 bytes, hex-encoded
    - DIDIT_WEBHOOK_SECRET   32 bytes, base64url (reserved for R-10 when wired)

  Each value is regenerated every time the script runs.
  Copy the output ONCE into your prod secrets manager
  (Fly.io secrets, Vercel env, etc.) and never run again.

.EXAMPLE
  pwsh ./gen-prod-secrets.ps1
  pwsh ./gen-prod-secrets.ps1 -OutFile secrets.txt    # save to a file you must delete
#>
[CmdletBinding()]
param(
  [string]$OutFile
)

function New-Secret {
  param(
    [int]$Bytes,
    [ValidateSet('base64url', 'hex')]
    [string]$Encoding
  )
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $buf = [byte[]]::new($Bytes)
  $rng.GetBytes($buf)
  $rng.Dispose()
  if ($Encoding -eq 'hex') {
    return ($buf | ForEach-Object { $_.ToString('x2') }) -join ''
  }
  # base64url = base64 with -, _ and no padding
  $b64 = [Convert]::ToBase64String($buf)
  return $b64.Replace('+', '-').Replace('/', '_').Replace('=', '')
}

$jwt   = New-Secret -Bytes 48 -Encoding base64url
$kyc   = New-Secret -Bytes 32 -Encoding hex
$didit = New-Secret -Bytes 32 -Encoding base64url

$lines = @(
  '# ────────────────────────────────────────────────────────────────',
  '# Souk ElKanto / CoreMesh — production secrets (generated ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ')',
  '# Paste each into your secrets manager. NEVER commit. NEVER share in chat.',
  '# ────────────────────────────────────────────────────────────────',
  '',
  'JWT_SECRET=' + $jwt,
  'KYC_ENCRYPTION_KEY=' + $kyc,
  '',
  '# Reserved for R-10 Didit integration when wired:',
  'DIDIT_WEBHOOK_SECRET=' + $didit
)

if ($OutFile) {
  # Use [System.IO.File]::WriteAllLines instead of Set-Content to avoid the
  # PowerShell terminal-width wrap that turns long base64url secrets into
  # multi-line garbage when the file is read back. Forces BOM-less UTF-8.
  $absPath = if ([System.IO.Path]::IsPathRooted($OutFile)) { $OutFile } else { Join-Path (Get-Location).Path $OutFile }
  [System.IO.File]::WriteAllLines($absPath, [string[]]$lines, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Saved to $absPath" -ForegroundColor Green
  Write-Host "Delete this file after pasting into your secrets manager:" -ForegroundColor Yellow
  Write-Host "  Remove-Item $absPath" -ForegroundColor Yellow
} else {
  $lines | ForEach-Object { Write-Host $_ }
}

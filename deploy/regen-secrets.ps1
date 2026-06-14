function New-Sec($Bytes, $Enc) {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $buf = [byte[]]::new($Bytes)
  $rng.GetBytes($buf)
  $rng.Dispose()
  if ($Enc -eq 'hex') {
    return ($buf | ForEach-Object { $_.ToString('x2') }) -join ''
  }
  $b64 = [Convert]::ToBase64String($buf)
  return $b64.Replace('+', '-').Replace('/', '_').Replace('=', '')
}

$jwt = New-Sec 48 'base64url'
$kyc = New-Sec 32 'hex'
$didit = New-Sec 32 'base64url'

$lines = @(
  "JWT_SECRET=$jwt",
  "KYC_ENCRYPTION_KEY=$kyc",
  "DIDIT_WEBHOOK_SECRET=$didit"
)

[System.IO.File]::WriteAllLines(
  (Join-Path $PSScriptRoot 'secrets-prod-bootstrap.txt'),
  $lines,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "JWT_SECRET length: $($jwt.Length)"
Write-Host "KYC_ENCRYPTION_KEY length: $($kyc.Length)"
Write-Host "DIDIT_WEBHOOK_SECRET length: $($didit.Length)"

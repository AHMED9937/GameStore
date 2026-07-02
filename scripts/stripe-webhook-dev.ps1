# Local Stripe webhook forwarding for GameStore dev.
# Run from repo root in a dedicated terminal (keep it open while testing payments).
#
# Prerequisites:
#   - Stripe CLI installed (winget install Stripe.StripeCli)
#   - STRIPE_SECRET_KEY set in .env
#   - API running: pnpm nx serve api
#
# Usage:
#   .\scripts\stripe-webhook-dev.ps1
#
# The script prints a whsec_... secret. Copy it into .env as STRIPE_WEBHOOK_SECRET,
# then restart the API so license fulfillment works after checkout.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env'

if (-not (Test-Path $envFile)) {
  Write-Error ".env not found at $envFile"
}

$stripeSecretKey = $null
foreach ($line in Get-Content $envFile) {
  if ($line -match '^STRIPE_SECRET_KEY=(.+)$') {
    $stripeSecretKey = $matches[1].Trim().Trim('"')
    break
  }
}

if (-not $stripeSecretKey) {
  Write-Error 'STRIPE_SECRET_KEY is empty in .env'
}

$stripeCmd = Get-Command stripe -ErrorAction SilentlyContinue
if (-not $stripeCmd) {
  Write-Error 'Stripe CLI not found. Install: winget install Stripe.StripeCli — then open a new terminal.'
}

Write-Host ''
Write-Host '=== Stripe webhook dev setup ===' -ForegroundColor Cyan
Write-Host ''

Write-Host 'Fetching webhook signing secret...' -ForegroundColor Yellow
$secret = & stripe listen --print-secret --api-key $stripeSecretKey 2>&1 | Out-String
$secret = $secret.Trim()

if ($secret -notmatch '^whsec_') {
  Write-Error "Could not get webhook secret. Output: $secret`nTry: stripe login"
}

Write-Host "Webhook secret: $secret" -ForegroundColor Green
Write-Host ''
Write-Host 'Add to .env:' -ForegroundColor Yellow
Write-Host "STRIPE_WEBHOOK_SECRET=$secret"
Write-Host ''
Write-Host 'Then restart the API (pnpm nx serve api).' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Starting webhook forwarder (Ctrl+C to stop)...' -ForegroundColor Cyan
Write-Host 'Forwarding to http://localhost:3333/api/payments/webhook' -ForegroundColor Gray
Write-Host ''

& stripe listen --forward-to localhost:3333/api/payments/webhook --api-key $stripeSecretKey

<#
.PREREQUISITE
  - Install ngrok or another tunnel tool: https://ngrok.com/download
  - PADDLE_API_KEY set in .env

.USAGE
  .\scripts\paddle-webhook-dev.ps1

This script starts a tunnel to localhost:3333/api/payments/webhook and prints
a public URL. Paste it into Paddle → Sandbox → Notifications destinations and
copy the signing secret into .env as PADDLE_NOTIFICATION_WEBHOOK_SECRET.
#>

$ErrorActionPreference = 'Stop'

Write-Host "Starting tunnel to http://localhost:3333/api/payments/webhook ..."
Write-Host ""

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
  Write-Error "ngrok is not installed or not on PATH. Download it from https://ngrok.com/download and run 'ngrok config add-authtoken <token>'."
  exit 1
}

Write-Host "Public URL will appear below. Copy it into your Paddle notification destination."
& ngrok http http://localhost:3333

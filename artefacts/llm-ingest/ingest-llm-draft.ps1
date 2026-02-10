param(
  [Parameter(Mandatory = $true)]
  [string]$Provider
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = "/workspace"
$InputDir = Join-Path $Root "artefacts/step4-cto-strategy/input"

New-Item -ItemType Directory -Force -Path $InputDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMddHHmmss"
$File = "cto-strategy-draft.$($Provider.ToLower()).md"
$Path = Join-Path $InputDir $File

@"
# UNGOVERNED DRAFT — $Provider

This file was ingested automatically.

It is **NOT trusted**.
It must pass deterministic governance before use.
"@ | Set-Content -Path $Path -Encoding UTF8

Write-Host "Draft ingested: $File"

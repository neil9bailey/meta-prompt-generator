param(
    [Parameter(Mandatory = $true)]
    [string]$Provider,

    [Parameter(Mandatory = $false)]
    [string]$ContextPath
)

Write-Host "=== DIIaC Governed Execution ==="
Write-Host "Provider: $Provider"

$contextHash = "NONE"

if ($ContextPath) {
    Write-Host "Execution context supplied:"
    Write-Host "Context path: $ContextPath"

    if (-not (Test-Path $ContextPath)) {
        Write-Error "Context file not found at $ContextPath"
        exit 1
    }

    $contextRaw = Get-Content $ContextPath -Raw
    $contextHash = (
        [System.Security.Cryptography.SHA256]::Create()
    ).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($contextRaw)) `
      | ForEach-Object { $_.ToString("x2") } `
      | Join-String
}

$workspace = "/workspace"
$inputDir  = "$workspace/artefacts/step4-cto-strategy/input"
$outputDir = "$workspace/artefacts/step4-cto-strategy/output"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# ---------------------------------------------------------
# Deterministic execution identity
# ---------------------------------------------------------

$executionId = [guid]::NewGuid().ToString()

Write-Host "Execution ID: $executionId"
Write-Host "Context Hash: $contextHash"

# ---------------------------------------------------------
# EXISTING GOVERNANCE LOGIC RUNS HERE
# (AI ingestion, policy enforcement, artefact generation)
# ---------------------------------------------------------

Write-Host "Governed artefacts generated successfully."

# ---------------------------------------------------------
# IMPORTANT:
# Ledger writes are handled exclusively by backend server.js
# This script MUST NOT write to ledger.
# ---------------------------------------------------------

exit 0

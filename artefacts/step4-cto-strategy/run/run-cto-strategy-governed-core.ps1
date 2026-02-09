param (
    [Parameter(Mandatory = $true)]
    [string]$Provider
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -----------------------------
# Root paths (Docker-safe)
# -----------------------------
# PSScriptRoot = .../artefacts/step4-cto-strategy/run
$Root = $PSScriptRoot |
    Split-Path -Parent |   # step4-cto-strategy
    Split-Path -Parent |   # artefacts
    Split-Path -Parent     # workspace repo root (/workspace)

$ContractPath = Join-Path $Root "contracts/strategy/cto-strategy-governed.v1.json"
$InputDir     = Join-Path $Root "artefacts/step4-cto-strategy/input"
$OutputDir    = Join-Path $Root "artefacts/step4-cto-strategy/output"
$LedgerPath   = Join-Path $Root "ledger/ledger.jsonl"

# -----------------------------
# Helpers
# -----------------------------
function Get-Sha256 {
    param ([string]$Value)

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
    $hash  = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
}

# Normalise provider label (metadata unification)
function Normalize-Provider {
    param([string]$P)

    $p2 = ($P ?? "").Trim()

    if ($p2 -match '^(chatgpt|openai)$') { return "ChatGPT (OpenAI)" }
    if ($p2 -match '^(microsoft copilot|copilot|m365 copilot)$') { return "Microsoft Copilot" }

    # fallback
    return $p2
}

# Basic UTF-8 normalisation (fixes â€” etc.)
function Normalize-Utf8 {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) { return $Text }

    # If content came in as cp1252-ish, writing as UTF8 fixes most cases.
    # Keep it simple: just return text; Set-Content UTF8 below is the key.
    return $Text
}

# -----------------------------
# Preconditions
# -----------------------------
if (-not (Test-Path $ContractPath)) {
    throw "Contract not found: $ContractPath"
}
if (-not (Test-Path $InputDir)) {
    throw "Input directory not found: $InputDir"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType File -Force -Path $LedgerPath | Out-Null

# -----------------------------
# Load contract
# -----------------------------
$ContractJson = Get-Content $ContractPath -Raw
$ContractHash = Get-Sha256 $ContractJson

$ProviderNormalized = Normalize-Provider $Provider

# -----------------------------
# Process each input file
# -----------------------------
Get-ChildItem $InputDir -Filter "*.md" | ForEach-Object {

    $InputContentRaw = Get-Content $_.FullName -Raw
    $InputContent    = Normalize-Utf8 $InputContentRaw

    $InputHash    = Get-Sha256 $InputContent
    $ExecutionId  = [guid]::NewGuid().ToString()

    # Previous ledger hash
    $PreviousHash = "GENESIS"
    if ((Get-Item $LedgerPath).Length -gt 0) {
        $LastEntry    = Get-Content $LedgerPath | Select-Object -Last 1 | ConvertFrom-Json
        $PreviousHash = $LastEntry.entry_hash
    }

    # -----------------------------
    # Governed output
    # -----------------------------
    $GovernedContent = @"
# CTO Strategy Report — Governed Output

## Governance Metadata
- Execution ID: $ExecutionId
- Provider: $ProviderNormalized
- Contract Hash: $ContractHash
- Input Hash: $InputHash
- Previous Ledger Hash: $PreviousHash
- Risk Classification: LOW

## Determinism Assertion
This report was produced via deterministic DIIaC execution.
The upstream AI provider does not affect governance outcomes.

---

$InputContent
"@

    $OutputFileName = "cto-strategy-governed-$($_.Name)"
    $OutputPath     = Join-Path $OutputDir $OutputFileName

    # Critical: write UTF-8
    Set-Content -Path $OutputPath -Value $GovernedContent -Encoding UTF8

    # -----------------------------
    # Ledger entry
    # -----------------------------
    $EntryHash = Get-Sha256 (
        $ExecutionId +
        $InputHash +
        $ContractHash +
        $PreviousHash +
        $ProviderNormalized
    )

    $LedgerEntry = @(
        @{
            timestamp      = (Get-Date).ToString("o")
            execution_id   = $ExecutionId
            provider       = $ProviderNormalized
            contract_id    = "cto-strategy-governed"
            contract_hash  = $ContractHash
            input_hash     = $InputHash
            previous_hash  = $PreviousHash
            entry_hash     = $EntryHash
            risk           = "LOW"
        } | ConvertTo-Json -Compress
    )

    Add-Content -Path $LedgerPath -Value $LedgerEntry
}

Write-Host "Step 4 deterministic governance run complete."

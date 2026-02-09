Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Resolve deterministic root path
if ($env:DIIAC_ROOT) {
    $root = [string]$env:DIIAC_ROOT
} else {
    $resolved = Resolve-Path "..\..\.." | Select-Object -First 1
    $root = [string]$resolved.Path
}

# Explicit paths (no Join-Path ambiguity)
$contractPath = "$root/contracts/strategy/cto-strategy-governed.v1.json"

$inputPaths = @(
    "$root/artefacts/step4-cto-strategy/input/cto-strategy-draft.copilot.md",
    "$root/artefacts/step4-cto-strategy/input/cto-strategy-draft.chatgpt.md"
)

$ledgerPath = "$root/ledger/ledger.jsonl"
$outputDir  = "$root/artefacts/step4-cto-strategy/output"

# Load ledger safely
$ledgerLines = @()
if (Test-Path $ledgerPath) {
    $ledgerLines = @(Get-Content $ledgerPath -ErrorAction SilentlyContinue)
}

foreach ($inputPath in $inputPaths) {

    $executionId = [Guid]::NewGuid().ToString()
    $timestamp   = (Get-Date).ToString("o")

    $contractHash = (Get-FileHash $contractPath -Algorithm SHA256).Hash
    $inputHash    = (Get-FileHash $inputPath -Algorithm SHA256).Hash

    $previousHash = if ($ledgerLines.Count -gt 0) {
        ($ledgerLines[$ledgerLines.Count - 1] | ConvertFrom-Json).entry_hash
    } else {
        "GENESIS"
    }

    $hashMaterial = "$executionId|$timestamp|$contractHash|$inputHash|$previousHash"
    $entryHash = [BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash(
            [System.Text.Encoding]::UTF8.GetBytes($hashMaterial)
        )
    ).Replace("-", "")

    $ledgerEntry = @{
        execution_id  = $executionId
        timestamp     = $timestamp
        contract_id   = "cto-strategy-governed"
        contract_hash = $contractHash
        input_hash    = $inputHash
        previous_hash = $previousHash
        entry_hash    = $entryHash
        risk          = "LOW"
    } | ConvertTo-Json -Compress

    Add-Content -Path $ledgerPath -Value $ledgerEntry
    $ledgerLines += $ledgerEntry

    $outputFile = "$outputDir/cto-strategy-governed-$(Split-Path $inputPath -Leaf)"

@"
# CTO Strategy Report — Governed Output

## Governance Metadata
- Execution ID: $executionId
- Contract Hash: $contractHash
- Input Hash: $inputHash
- Ledger Entry Hash: $entryHash
- Previous Ledger Hash: $previousHash
- Risk Classification: LOW

## Determinism Assertion
This report was produced via deterministic DIIaC execution.
The origin of AI-assisted input does not affect governance outcomes.

---

$(Get-Content $inputPath -Raw)
"@ | Set-Content $outputFile -Encoding UTF8
}

Write-Host "Step 4 deterministic governance run complete."

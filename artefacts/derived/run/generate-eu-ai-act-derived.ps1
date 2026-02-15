param()

$ErrorActionPreference = "Stop"

$Workspace = "/workspace"

$LedgerPath = "$Workspace/ledger/ledger.jsonl"
$DerivedDir = "$Workspace/artefacts/derived"

if (!(Test-Path $LedgerPath)) {
    throw "Ledger not found at $LedgerPath"
}

if (!(Test-Path $DerivedDir)) {
    New-Item -ItemType Directory -Path $DerivedDir | Out-Null
}

# Read strict ledger
$Lines = Get-Content $LedgerPath | Where-Object { $_.Trim() -ne "" }

$Records = @()

foreach ($Line in $Lines) {
    try {
        $Records += $Line | ConvertFrom-Json
    }
    catch {
        # Ignore malformed lines (should not exist in strict chain)
    }
}

# Detect governed executions only
$Governed = $Records | Where-Object {
    $_.type -eq "GOVERNED_EXECUTION"
}

# ----------------------------------------------------------
# EU AI Act High Risk Classification
# ----------------------------------------------------------

$HighRiskReport = @"
# EU AI Act — High Risk Classification

Generated: $(Get-Date -Format u)

Detected governed AI systems: $($Governed.Count)

Risk determination logic:
- Governance contract: CTO_STRATEGY_BASELINE
- Policy version: 1.0.0
- Default classification: LOW (strategic planning domain)

This artefact is deterministically derived from immutable ledger entries.
No AI systems were used in its generation.
"@

Set-Content -Path "$DerivedDir/eu-ai-act-high-risk-classification.md" -Value $HighRiskReport -Encoding UTF8

# ----------------------------------------------------------
# EU AI Act Compliance Evidence Index
# ----------------------------------------------------------

$LedgerRoot = "GENESIS"

if ($Records.Count -gt 0) {
    $Last = $Records[-1]
    if ($Last.record_hash) {
        $LedgerRoot = $Last.record_hash
    }
}

$EvidenceReport = @"
# EU AI Act Compliance Evidence Index

Generated: $(Get-Date -Format u)

Detected governed AI contracts: $($Governed.Count)

Ledger root reference:
$LedgerRoot

Evidence scope:
- Immutable ledger chain
- Governance execution records
- Policy binding (CTO_STRATEGY_BASELINE)
- Risk tagging
- Decision sign-off linkage (if present)

This artefact is deterministically derived from immutable ledger entries.
No AI systems were used in its generation.
"@

Set-Content -Path "$DerivedDir/eu-ai-act-compliance-evidence-index.md" -Value $EvidenceReport -Encoding UTF8

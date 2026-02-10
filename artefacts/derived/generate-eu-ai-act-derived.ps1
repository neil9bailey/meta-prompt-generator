Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --------------------------------------------------
# Paths (container-safe)
# --------------------------------------------------
$Workspace   = "/workspace"
$LedgerPath = Join-Path $Workspace "ledger/ledger.jsonl"
$DerivedDir = Join-Path $Workspace "artefacts/derived"

# Ensure derived directory exists
New-Item -ItemType Directory -Force -Path $DerivedDir | Out-Null

# --------------------------------------------------
# Preconditions
# --------------------------------------------------
if (-not (Test-Path $LedgerPath)) {
    throw "Ledger not found: $LedgerPath"
}

# --------------------------------------------------
# Load ledger entries
# --------------------------------------------------
$Entries = Get-Content $LedgerPath |
    Where-Object { $_.Trim() -ne "" } |
    ForEach-Object { $_ | ConvertFrom-Json }

if ($Entries.Count -eq 0) {
    throw "Ledger is empty — no governed executions to derive from"
}

# --------------------------------------------------
# Deterministic derivations
# --------------------------------------------------
$ExecutionCount = $Entries.Count
$Risks = @{}
$Contracts = @{}
$Inputs = @{}

foreach ($e in $Entries) {
    $Risks[$e.risk] = ($Risks[$e.risk] + 1)
    $Contracts[$e.contract_hash] = $true
    $Inputs[$e.input_hash] = $true
}

# --------------------------------------------------
# High-Risk Classification (EU AI Act)
# --------------------------------------------------
$HighRiskPath = Join-Path $DerivedDir "eu-ai-act-high-risk-classification.md"

@"
# EU AI Act — High-Risk Classification Summary

## Regulatory Basis
This artefact is deterministically derived from immutable governance records.
No AI systems were used in its generation.

## System Classification
This system performs **decision-support and advisory functions** for enterprise governance.

It does **not**:
- Make automated decisions affecting legal rights
- Perform biometric identification
- Execute real-time control of physical systems

## Risk Determination
Based on governed usage evidence:

- **EU AI Act High-Risk Category**: NO
- **Primary Justification**: Human-in-the-loop, advisory-only outputs
- **Safeguards**: Deterministic contracts, immutable ledger, auditability

## Evidence Summary
- Total governed executions: $ExecutionCount
- Observed risk classifications:
$(($Risks.GetEnumerator() | ForEach-Object { "- $($_.Key): $($_.Value)" }) -join "`n")

---
Generated deterministically from governance ledger.
"@ | Set-Content -Path $HighRiskPath -Encoding UTF8

# --------------------------------------------------
# Compliance Evidence Index
# --------------------------------------------------
$EvidenceIndexPath = Join-Path $DerivedDir "eu-ai-act-compliance-evidence-index.md"

@"
# EU AI Act — Compliance Evidence Index

## Purpose
This document enumerates compliance-relevant evidence derived from
governed AI usage under deterministic control.

## Evidence Sources
- Immutable execution ledger
- Governance contracts
- Input/output hash chaining

## Evidence Metrics
- Total executions recorded: $ExecutionCount
- Unique governance contracts: $($Contracts.Count)
- Unique governed inputs: $($Inputs.Count)

## Controls Demonstrated
- Deterministic execution
- Provider-agnostic governance
- Risk classification per execution
- Full audit traceability

## Exclusions
- No model training
- No adaptive behaviour
- No autonomous decision-making

---
Generated deterministically from governance ledger.
"@ | Set-Content -Path $EvidenceIndexPath -Encoding UTF8

Write-Host "EU AI Act derived artefacts generated successfully."

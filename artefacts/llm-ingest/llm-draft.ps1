param (
    [Parameter(Mandatory)]
    [ValidateSet("ChatGPT", "Microsoft Copilot")]
    [string]$Provider
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = "/workspace"
$IngestDir = Join-Path $Root "artefacts/llm-ingest"
$InputDir  = Join-Path $Root "artefacts/step4-cto-strategy/input"

$ProviderDir = if ($Provider -eq "ChatGPT") { "chatgpt" } else { "copilot" }
$SourceFile = Join-Path $IngestDir "$ProviderDir/cto-strategy-draft.md"

if (-not (Test-Path $SourceFile)) {
    throw "LLM draft not found: $SourceFile"
}

New-Item -ItemType Directory -Force -Path $InputDir | Out-Null

$TargetFile = Join-Path $InputDir "cto-strategy-draft.$($ProviderDir).md"

@"
<!--
UNTRUSTED LLM INPUT
Provider: $Provider
Ingested: $(Get-Date -Format o)
-->
$(Get-Content $SourceFile -Raw)
"@ | Set-Content -Path $TargetFile -Encoding UTF8

Write-Host "LLM draft ingested for $Provider"

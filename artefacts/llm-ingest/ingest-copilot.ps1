param (
    [Parameter(Mandatory = $true)]
    [string]$Prompt
)

# --- Production assumptions ---
# - Running inside trusted tenant context
# - Entra ID auth already configured
# - No interactive login here

$timestamp = (Get-Date).ToUniversalTime().ToString("o")

# In real deployments, replace this block with:
# - Microsoft Graph call
# - Copilot Studio API
# - M365 Copilot export pipeline

$responseText = "Copilot generated response placeholder"

$record = @{
    timestamp     = $timestamp
    provider      = "copilot"
    model         = "m365-copilot"
    prompt_hash   = (Get-FileHash -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($Prompt))) -Algorithm SHA256).Hash.ToLower()
    response_hash = (Get-FileHash -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($responseText))) -Algorithm SHA256).Hash.ToLower()
    trusted       = $false
    content       = $responseText
}

$outDir = "/workspace/artefacts/llm-ingestion"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$file = Join-Path $outDir ("{0}-{1}.json" -f ([int][double]::Parse((Get-Date -UFormat %s))), $record.response_hash)

$record | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 $file

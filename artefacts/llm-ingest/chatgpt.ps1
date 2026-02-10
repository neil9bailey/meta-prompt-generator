param([string]$OutputDir)

@"
# CTO Strategy Draft (ChatGPT)

[PLACEHOLDER]
This draft was programmatically ingested.
"@ | Set-Content -Path (Join-Path $OutputDir "cto-strategy-draft.chatgpt.md") -Encoding UTF8

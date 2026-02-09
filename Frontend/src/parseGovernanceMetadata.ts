export interface GovernanceMetadata {
  executionId: string;
  provider: string;
  contractHash: string;
  inputHash: string;
  previousLedgerHash: string;
  risk: string;
}

function extract(markdown: string, label: string): string {
  const regex = new RegExp(`${label}:\\s*(.+)`, "i");
  const match = markdown.match(regex);
  return match ? match[1].trim() : "UNKNOWN";
}

export function parseGovernanceMetadata(
  markdown: string
): GovernanceMetadata {
  return {
    executionId: extract(markdown, "Execution ID"),
    provider: extract(markdown, "Provider"),
    contractHash: extract(markdown, "Contract Hash"),
    inputHash: extract(markdown, "Input Hash"),
    previousLedgerHash: extract(markdown, "Previous Ledger Hash"),
    risk: extract(markdown, "Risk Classification"),
  };
}

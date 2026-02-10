type GovernanceMetadata = {
  provider?: string;
  executionId?: string;
  contractHash?: string;
  inputHash?: string;
  previousLedgerHash?: string;
  riskClassification?: string;
};

export default function GovernanceMetadataPanel({
  metadata
}: {
  metadata?: GovernanceMetadata | null;
}) {
  // -----------------------------
  // Guard: no metadata (derived artefacts, load race, etc.)
  // -----------------------------
  if (!metadata) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        marginBottom: "1rem",
        background: "#fafafa"
      }}
    >
      <h4>Governance Metadata</h4>

      <table>
        <tbody>
          {metadata.provider && (
            <tr>
              <td><strong>Provider</strong></td>
              <td>{metadata.provider}</td>
            </tr>
          )}

          {metadata.riskClassification && (
            <tr>
              <td><strong>Risk Classification</strong></td>
              <td>{metadata.riskClassification}</td>
            </tr>
          )}

          {metadata.executionId && (
            <tr>
              <td><strong>Execution ID</strong></td>
              <td>{metadata.executionId}</td>
            </tr>
          )}

          {metadata.contractHash && (
            <tr>
              <td><strong>Contract Hash</strong></td>
              <td>{metadata.contractHash}</td>
            </tr>
          )}

          {metadata.inputHash && (
            <tr>
              <td><strong>Input Hash</strong></td>
              <td>{metadata.inputHash}</td>
            </tr>
          )}

          {metadata.previousLedgerHash && (
            <tr>
              <td><strong>Previous Ledger Hash</strong></td>
              <td>{metadata.previousLedgerHash}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
        This metadata is extracted directly from the governed artefact and
        represents immutable execution evidence.
      </p>
    </section>
  );
}

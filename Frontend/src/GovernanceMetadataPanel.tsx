import { GovernanceMetadata } from "./parseGovernanceMetadata";

export default function GovernanceMetadataPanel({
  metadata,
}: {
  metadata: GovernanceMetadata;
}) {
  return (
    <div
      style={{
        border: "1px solid #d0d0d0",
        background: "#f8f9fb",
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <h4>Governance Metadata</h4>

      <table>
        <tbody>
          <tr>
            <td><strong>Provider</strong></td>
            <td>{metadata.provider}</td>
          </tr>
          <tr>
            <td><strong>Risk Classification</strong></td>
            <td>{metadata.risk}</td>
          </tr>
          <tr>
            <td><strong>Execution ID</strong></td>
            <td>{metadata.executionId}</td>
          </tr>
          <tr>
            <td><strong>Contract Hash</strong></td>
            <td>{metadata.contractHash}</td>
          </tr>
          <tr>
            <td><strong>Input Hash</strong></td>
            <td>{metadata.inputHash}</td>
          </tr>
          <tr>
            <td><strong>Previous Ledger Hash</strong></td>
            <td>{metadata.previousLedgerHash}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: "0.85em", color: "#555", marginTop: "0.75rem" }}>
        This metadata is extracted directly from the governed artefact and
        represents immutable execution evidence.
      </p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { runPolicyImpact } from "./api";

type ImpactReport = {
  schema_id: string;
  schema_version: string;
  summary?: {
    severity?: string;
    controls_evaluated?: number;
    findings?: number;
  };
  artefacts?: string[];
  audit?: {
    ledger_root?: string;
    timestamp?: string;
  };
};

export default function ImpactViewer() {
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyse() {
    try {
      setLoading(true);
      setError(null);
      const result = await runPolicyImpact();
      setReport(result);
    } catch (err: any) {
      setError(err.message || "Impact analysis failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    analyse();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Policy Impact Analysis</h2>

      {loading && <p>Running impact analysis...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && !report && (
        <p>No report generated yet.</p>
      )}

      {report && (
        <>
          <h3>Summary</h3>
          <p><strong>Severity:</strong> {report.summary?.severity || "N/A"}</p>
          <p><strong>Controls Evaluated:</strong> {report.summary?.controls_evaluated ?? "N/A"}</p>
          <p><strong>Findings:</strong> {report.summary?.findings ?? "N/A"}</p>

          <h3>Artefacts</h3>
          {report.artefacts && report.artefacts.length > 0 ? (
            <ul>
              {report.artefacts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p>No artefacts found.</p>
          )}

          <h3>Audit</h3>
          <p><strong>Ledger Root:</strong> {report.audit?.ledger_root || "N/A"}</p>
          <p><strong>Timestamp:</strong> {report.audit?.timestamp || "N/A"}</p>

          <button onClick={analyse} style={{ marginTop: "15px" }}>
            Re-run Impact Analysis
          </button>
        </>
      )}
    </div>
  );
}

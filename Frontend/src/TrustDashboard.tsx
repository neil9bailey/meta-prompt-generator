import { useEffect, useState } from "react";
import { fetchTrustDashboard } from "./api";

export default function TrustDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrustDashboard()
      .then(setData)
      .catch(() => {
        setError("Access denied — admin role required.");
      });
  }, []);

  if (error) {
    return (
      <section>
        <h3>Trust Dashboard</h3>
        <p style={{ color: "darkred", fontWeight: "bold" }}>{error}</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section>
      <h3>Trust Dashboard</h3>

      <p>
        <strong>Executions:</strong> {data.executions}
      </p>

      <p>
        <strong>Providers:</strong> {data.providers.join(", ")}
      </p>

      <p>
        <strong>Risk Distribution:</strong>
      </p>
      <pre>{JSON.stringify(data.riskDistribution, null, 2)}</pre>

      <p>
        <strong>Ledger Continuity:</strong> {data.ledgerContinuity}
      </p>
    </section>
  );
}

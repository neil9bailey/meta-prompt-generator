import { useEffect, useState } from "react";
import { fetchTrustDashboard } from "./api";

export default function TrustDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrustDashboard()
      .then(setData)
      .catch(() => setError("Failed to load trust dashboard"));
  }, []);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading trust data…</p>;

  const providers = Array.isArray(data.providers)
    ? data.providers.join(", ")
    : "None";

  return (
    <div>
      <h2>Trust Dashboard</h2>

      <p><strong>Executions:</strong> {data.executions ?? 0}</p>
      <p><strong>Providers:</strong> {providers}</p>
      <p><strong>Ledger Continuity:</strong> {data.ledgerContinuity}</p>

      <h3>Risk Distribution</h3>
      <ul>
        {data.riskDistribution &&
          Object.entries(data.riskDistribution).map(([risk, count]) => (
            <li key={risk}>
              {risk}: {count}
            </li>
          ))}
      </ul>
    </div>
  );
}

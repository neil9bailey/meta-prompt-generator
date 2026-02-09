import { useEffect, useState } from "react";
import { fetchTrustDashboard } from "./api";

type TrustData = {
  executions: number;
  providers: string[];
  riskDistribution: Record<string, number>;
  ledgerContinuity: string;
};

export default function TrustDashboard() {
  const [data, setData] = useState<TrustData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrustDashboard()
      .then(setData)
      .catch(() =>
        setError("Access denied — admin role required.")
      );
  }, []);

  if (error) {
    return (
      <section>
        <h2>Trust Dashboard</h2>
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      </section>
    );
  }

  if (!data) {
    return <p>Loading trust signals…</p>;
  }

  return (
    <section>
      <h2>Trust Dashboard</h2>

      <p>
        <strong>Executions:</strong> {data.executions}
      </p>

      <p>
        <strong>Providers:</strong>{" "}
        {data.providers.length > 0
          ? data.providers.join(", ")
          : "None"}
      </p>

      <h4>Risk Distribution</h4>
      <pre>{JSON.stringify(data.riskDistribution, null, 2)}</pre>

      <p>
        <strong>Ledger Continuity:</strong>{" "}
        {data.ledgerContinuity}
      </p>
    </section>
  );
}

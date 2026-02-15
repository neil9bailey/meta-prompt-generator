import { useState } from "react";

const BACKEND = "http://localhost:3001";

export default function HumanInputPanel() {
  const [intent, setIntent] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function run() {
    setStatus(null);

    const res = await fetch(`${BACKEND}/api/execute/human-input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": "admin"
      },
      body: JSON.stringify({
        provider: "ChatGPT",
        intent,
        context: {
          audience: "Board",
          urgency: "High"
        }
      })
    });

    if (!res.ok) {
      setStatus("Execution failed");
      return;
    }

    setStatus("Governed execution completed");
    setIntent("");
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3>Governed Human Input</h3>

      <p>
        Human intent is treated as untrusted input and executed only through
        deterministic governance contracts.
      </p>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
        placeholder="Enter business intent..."
      />

      <button onClick={run} disabled={!intent}>
        Execute Governed Request
      </button>

      {status && <p>{status}</p>}
    </section>
  );
}

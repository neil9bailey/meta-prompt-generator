import { useState } from "react";
import { runGovernedCtoStrategy } from "./api";

type GovernanceResult = {
  status: string;
  message: string;
  artefactPath?: string;
};

export default function GovernedCtoStrategy() {
  const [status, setStatus] = useState<
    "idle" | "running" | "complete" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  async function handleRun() {
    setStatus("running");
    setMessage("");

    try {
      const result: GovernanceResult = await runGovernedCtoStrategy();

      let outputMessage = result.message;
      if (result.artefactPath) {
        outputMessage += `\nOutput location: ${result.artefactPath}`;
      }

      setMessage(outputMessage);
      setStatus("complete");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Governance execution failed");
    }
  }

  return (
    <section>
      <h2>CTO Strategy Output (Governed)</h2>

      <p>
        Applies the <strong>CTO Strategy governance contract</strong> using
        deterministic DIIaC execution.
      </p>

      <ul>
        <li>AI-assisted drafts are treated as untrusted</li>
        <li>Policy enforcement is deterministic</li>
        <li>Evidence is recorded in an immutable ledger</li>
      </ul>

      <button onClick={handleRun} disabled={status === "running"}>
        Run Governance
      </button>

      {status === "running" && <p>Running governance…</p>}

      {status === "complete" && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: "1rem",
            marginTop: "1rem",
          }}
        >
          {message}
        </pre>
      )}

      {status === "error" && (
        <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>
      )}
    </section>
  );
}

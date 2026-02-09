import { useState } from "react";
import { runGovernedCtoStrategy } from "./api";

type Status = "idle" | "running" | "complete" | "error";

export default function GovernedCtoStrategy() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleRun(provider: string) {
    setStatus("running");
    setMessage("");

    try {
      const result = await runGovernedCtoStrategy(provider);

      setStatus("complete");
      setMessage(
        result?.message ??
          "Governed reports generated successfully. Select a report below to view immutable, policy-governed output."
      );
    } catch {
      setStatus("error");
      setMessage(
        "Governance execution failed. No ungoverned output was produced. See backend logs for details."
      );
    }
  }

  return (
    <section>
      <h2>DIIaC Governance Console</h2>

      <p>
        This interface provides access to{" "}
        <strong>deterministic, policy-governed enterprise outputs</strong>.
        AI-assisted content is treated as <strong>untrusted input</strong> and is
        subject to contract-enforced validation, risk classification, and
        immutable audit recording.
      </p>

      <h3>CTO Strategy Outputs (Governed)</h3>

      <p>
        Applies the <strong>CTO Strategy governance contract</strong> to generate
        one or more board-ready reports using upstream AI providers (e.g.
        ChatGPT, Microsoft Copilot).
      </p>

      <ul>
        <li>AI-assisted drafts are treated as untrusted</li>
        <li>Policy enforcement is deterministic and repeatable</li>
        <li>Outputs are read-only and cryptographically evidenced</li>
        <li>Each execution is recorded in an immutable ledger</li>
      </ul>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button
          onClick={() => handleRun("ChatGPT")}
          disabled={status === "running"}
        >
          Run Governance (ChatGPT)
        </button>

        <button
          onClick={() => handleRun("Microsoft Copilot")}
          disabled={status === "running"}
        >
          Run Governance (Microsoft Copilot)
        </button>
      </div>

      {status === "running" && <p>Running deterministic governance…</p>}

      {status === "complete" && (
        <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>
      )}

      {status === "error" && (
        <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>
      )}
    </section>
  );
}

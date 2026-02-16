import { runGovernedCtoStrategy } from "./api";

export default function GovernedCtoStrategy() {

  async function run(provider: string) {
    await runGovernedCtoStrategy(provider);
    alert("Governance Execution Complete");
  }

  return (
    <div className="panel">
      <h2>Governed Decision Report Engine</h2>

      <p>
        Executes a deterministic governance contract against approved AI
        providers to generate board-ready strategic decision reports.
        All outputs are cryptographically bound into the governance ledger
        and decision pack.
      </p>

      <div className="button-row">
        <button
          className="btn-primary"
          onClick={() => run("ChatGPT")}
        >
          Execute Governance via ChatGPT
        </button>

        <button
          className="btn-secondary"
          onClick={() => run("Copilot")}
        >
          Execute Governance via Microsoft Copilot
        </button>
      </div>
    </div>
  );
}

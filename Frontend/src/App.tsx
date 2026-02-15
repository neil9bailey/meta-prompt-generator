import GovernedCtoStrategy from "./GovernedCtoStrategy";
import GovernedReportViewer from "./GovernedReportViewer";
import EUAIActPanel from "./EUAIActPanel";
import TrustDashboard from "./TrustDashboard";
import ImpactViewer from "./ImpactViewer";
import HumanIntentPanel from "./HumanIntentPanel";

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>DIIaC — Deterministic AI Governance</h2>

      <p>
        This interface provides access to deterministic, policy-governed
        enterprise outputs. AI-assisted content is treated as untrusted
        input and is subject to contract-enforced validation, risk
        classification, and immutable audit recording.
      </p>

      <GovernedCtoStrategy />
      <GovernedReportViewer />
      <EUAIActPanel />
      <TrustDashboard />
      <ImpactViewer />
      <HumanIntentPanel />
    </main>
  );
}

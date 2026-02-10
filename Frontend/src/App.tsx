import "./App.css";

import GovernedCtoStrategy from "./GovernedCtoStrategy";
import GovernedReportViewer from "./GovernedReportViewer";
import TrustDashboard from "./TrustDashboard";
import EUAIActPanel from "./EUAIActPanel";

export default function App() {
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>DIIaC Governance Console</h1>

      <GovernedCtoStrategy />

      <hr />

      <GovernedReportViewer />

      <hr />

      <EUAIActPanel />

      <hr />

      <TrustDashboard />
    </main>
  );
}

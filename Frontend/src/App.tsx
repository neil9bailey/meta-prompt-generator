import "./App.css";
import GovernedCtoStrategy from "./GovernedCtoStrategy";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Segoe UI, Arial, sans-serif" }}>
      <h1>DIIaC Governance Console</h1>

      <p>
        This interface provides access to deterministic, policy-governed
        enterprise outputs. AI-assisted content is treated as untrusted input.
      </p>

      <hr />

      <GovernedCtoStrategy />
    </div>
  );
}

export default App;

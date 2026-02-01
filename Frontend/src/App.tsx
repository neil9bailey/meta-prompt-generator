/**
 * VendorLogic DIIaC v1.1.0 (Clean)
 * Control Plane — Mock Adapter Baseline
 */

import { useState } from "react";
import { generatePrompt } from "./api";
import "./App.css";

/**
 * LOCKED BASELINE
 * These values are the ONLY supported pair today
 * as declared by MockAdapter.capabilities
 */
const EXECUTION_SCHEMA = "network-design";
const ROLE = "network-architect";
const INTENT = "baseline";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const compile = async () => {
    setError("");
    setResult("");

    try {
      const response = await generatePrompt({
        execution_schema: EXECUTION_SCHEMA,
        role: ROLE,
        intent: INTENT,
        input: {
          text,
        },
        options: {},
      });

      setResult(JSON.stringify(response, null, 2));
    } catch (e: any) {
      setError(e.message ?? "Compilation failed");
    }
  };

  return (
    <div className="container">
      <header>
        <h1>VendorLogic Meta Prompt Generator</h1>
        <p>v1.1.0-clean · Baseline Adapter</p>
        <p>
          Schema: <strong>{EXECUTION_SCHEMA}</strong> ·
          Role: <strong>{ROLE}</strong>
        </p>
      </header>

      <section>
        <textarea
          placeholder="Enter network design task…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
      </section>

      <section>
        <button onClick={compile} disabled={!text}>
          Compile Prompt
        </button>
      </section>

      {error && (
        <section>
          <pre className="error">{error}</pre>
        </section>
      )}

      {result && (
        <section>
          <h3>Result</h3>
          <pre>{result}</pre>
        </section>
      )}
    </div>
  );
}

export default App;

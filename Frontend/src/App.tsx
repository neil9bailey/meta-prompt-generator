import { useEffect, useState } from "react";
import {
  fetchRoles,
  fetchSchemas,
  generatePrompt,
  Role,
  Schema,
} from "./api";
import "./App.css";

function App() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [role, setRole] = useState("");
  const [schemaId, setSchemaId] = useState("");
  const [intent, setIntent] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load roles")
      );

    fetchSchemas()
      .then(setSchemas)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load schemas")
      );
  }, []);

  async function onGenerate() {
    setError(null);
    try {
      const res = await generatePrompt({
        role,
        schema_id: schemaId,
        intent,
        input: {},
      });
      setOutput(res.prompt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  }

  return (
    <div className="App">
      <h1>Meta Prompt Generator v1.0.0</h1>

      <div>
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Schema</label>
        <select
          value={schemaId}
          onChange={(e) => setSchemaId(e.target.value)}
        >
          <option value="">Select schema</option>
          {schemas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Intent</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>

      <button onClick={onGenerate} disabled={!role || !schemaId || !intent}>
        Generate
      </button>

      {error && <pre style={{ color: "red" }}>{error}</pre>}
      {output && <pre>{output}</pre>}
    </div>
  );
}

export default App;

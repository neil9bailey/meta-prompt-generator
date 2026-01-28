import { useEffect, useState } from "react";
import { fetchRoles, fetchSchemas, generatePrompt } from "./api";

export default function App() {
  const [roles, setRoles] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [schema, setSchema] = useState("");
  const [task, setTask] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles().then(r => {
      setRoles(r);
      setRole(r[0] ?? "");
    });

    fetchSchemas().then(s => {
      setSchemas(s);
      setSchema(s[0] ?? "");
    });
  }, []);

  async function onGenerate() {
    setLoading(true);
    setOutput("");
    try {
      const prompt = await generatePrompt(role, task, schema);
      setOutput(prompt);
    } catch (err) {
      setOutput(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Meta Prompt Generator</h1>

      <label>
        Role
        <select value={role} onChange={e => setRole(e.target.value)}>
          {roles.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label>
        Schema
        <select value={schema} onChange={e => setSchema(e.target.value)}>
          {schemas.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <textarea
        placeholder="Describe the task..."
        value={task}
        onChange={e => setTask(e.target.value)}
        rows={6}
        style={{ width: "100%", marginTop: 12 }}
      />

      <button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating…" : "Generate"}
      </button>

      <pre
        style={{
          marginTop: 16,
          padding: 16,
          background: "#111",
          color: "#0f0",
          whiteSpace: "pre-wrap",
        }}
      >
        {output}
      </pre>
    </main>
  );
}

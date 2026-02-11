import { useEffect, useState, useCallback } from "react";
import { fetchRoles, fetchSchemas, generatePrompt } from "./api";
import type { GenerateResult } from "./api";
import "./App.css";

const VENDOR_OPTIONS = [
  { value: "palo_alto", label: "Palo Alto Networks" },
];

const SECURITY_OPTIONS = [
  { value: "zero_trust", label: "Zero Trust" },
];

const SECTION_KEYWORDS = [
  "ACT AS:",
  "TASK:",
  "FIRST-PRINCIPLES MODE:",
  "DEVIL'S ADVOCATE MODE:",
  "CONSTRAINTS-FIRST MODE:",
  "SECURITY OVERLAY:",
  "OUTPUT FORMAT:",
];

function highlightPrompt(text: string) {
  const parts: (string | { label: string; rest: string })[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = -1;
    let matchedKeyword = "";

    for (const kw of SECTION_KEYWORDS) {
      const idx = remaining.indexOf(kw);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matchedKeyword = kw;
      }
    }

    if (earliest === -1) {
      parts.push(remaining);
      break;
    }

    if (earliest > 0) {
      parts.push(remaining.slice(0, earliest));
    }

    const afterKeyword = remaining.slice(earliest + matchedKeyword.length);
    const nextNewline = afterKeyword.indexOf("\n");
    const restOfLine =
      nextNewline === -1 ? afterKeyword : afterKeyword.slice(0, nextNewline);

    parts.push({ label: matchedKeyword, rest: restOfLine });
    remaining =
      nextNewline === -1 ? "" : afterKeyword.slice(nextNewline + 1);
  }

  return parts.map((part, i) => {
    if (typeof part === "string") {
      return <span key={i}>{part}</span>;
    }
    return (
      <span key={i}>
        <span className="prompt-section-label">{part.label}</span>
        {part.rest}
        {"\n"}
      </span>
    );
  });
}

export default function App() {
  const [roles, setRoles] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [schema, setSchema] = useState("");
  const [task, setTask] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [security, setSecurity] = useState<string[]>([]);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchRoles().then((r) => {
      setRoles(r);
      setRole(r[0] ?? "");
    });
    fetchSchemas().then((s) => {
      setSchemas(s);
      setSchema(s[0] ?? "");
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  async function onGenerate() {
    if (!task.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await generatePrompt(
        role,
        task,
        schema,
        vendors.length > 0 ? vendors : undefined,
        security.length > 0 ? security : undefined,
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onGenerate();
    }
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    showToast("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleChip(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );
  }

  const canGenerate = task.trim().length > 0 && !loading;

  return (
    <>
      <header className="app-header">
        <h1>Meta Prompt Generator</h1>
        <span className="version">v1.0</span>
      </header>

      <div className="app-body">
        {/* ── Left: Input sidebar ── */}
        <aside className="sidebar">
          {/* Configuration card */}
          <div className="card">
            <h2 className="card-title">Configuration</h2>

            <div className="field">
              <label className="field-label" htmlFor="role-select">
                Role
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="schema-select">
                Schema
              </label>
              <select
                id="schema-select"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
              >
                {schemas.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Overlays card */}
          <div className="card">
            <h2 className="card-title">Overlays</h2>

            <div className="field">
              <span className="field-label">Vendor</span>
              <div className="checkbox-group">
                {VENDOR_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`checkbox-chip ${vendors.includes(opt.value) ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={vendors.includes(opt.value)}
                      onChange={() =>
                        toggleChip(opt.value, vendors, setVendors)
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="field-label">Security</span>
              <div className="checkbox-group">
                {SECURITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`checkbox-chip ${security.includes(opt.value) ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={security.includes(opt.value)}
                      onChange={() =>
                        toggleChip(opt.value, security, setSecurity)
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Task card */}
          <div className="card">
            <h2 className="card-title">Task</h2>
            <div className="field">
              <textarea
                id="task-input"
                placeholder="Design a zero-trust network architecture for a multi-cloud environment..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Task description"
              />
              <span className="char-count">{task.length} chars</span>
            </div>
          </div>

          <button
            className="btn-generate"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {loading && <span className="spinner" />}
            {loading ? "Generating..." : "Generate Prompt"}
          </button>
          <p className="btn-hint">
            {navigator.userAgent.includes("Mac") ? "\u2318" : "Ctrl"}+Enter
          </p>
        </aside>

        {/* ── Right: Output panel ── */}
        <section className="output-panel">
          <div className="output-toolbar">
            <div>
              <span className="label">Output</span>
              {result && (
                <span className="prompt-id" title={result.id}>
                  {" "}
                  {result.id}
                </span>
              )}
            </div>
            <div className="output-actions">
              {result && (
                <button
                  className={`btn-icon ${copied ? "copied" : ""}`}
                  onClick={onCopy}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {!result && !error && (
            <div className="output-empty">
              <div className="icon">&gt;_</div>
              <p>
                Configure a role, schema, and task, then click Generate to
                assemble your prompt.
              </p>
            </div>
          )}

          {result && (
            <div className="output-scroll">
              <pre className="output-prompt" aria-live="polite">
                {highlightPrompt(result.prompt)}
              </pre>
            </div>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

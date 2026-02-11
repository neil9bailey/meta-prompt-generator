import { useEffect, useState, useCallback, useRef } from "react";
import { fetchRoles, fetchSchemas, generatePrompt } from "./api";
import type { GenerateResult } from "./api";
import "./App.css";

/* ── Static options ── */
const VENDOR_OPTIONS = [
  { value: "palo_alto", label: "Palo Alto Networks" },
];

const SECURITY_OPTIONS = [
  { value: "zero_trust", label: "Zero Trust" },
];

const REPORT_TEMPLATES = [
  { value: "none", label: "No template" },
  { value: "executive_summary", label: "Executive Summary" },
  { value: "technical_design", label: "Technical Design Document" },
  { value: "security_assessment", label: "Security Assessment" },
];

/* ── Section keyword highlighting ── */
const SECTION_KEYWORDS = [
  "ACT AS:",
  "TASK:",
  "FIRST-PRINCIPLES MODE:",
  "DEVIL'S ADVOCATE MODE:",
  "CONSTRAINTS-FIRST MODE:",
  "SECURITY OVERLAY:",
  "VENDOR OVERLAY:",
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

/* ── Activity tracking ── */
interface ActivityStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
  elapsed?: number;
}

/* ── Report template formatting ── */
function formatReport(
  template: string,
  prompt: string,
  meta: { role: string; schema: string; task: string; id: string },
): string {
  const timestamp = new Date().toISOString();
  const divider = "=".repeat(60);

  if (template === "executive_summary") {
    return [
      divider,
      "EXECUTIVE SUMMARY REPORT",
      divider,
      "",
      `Date:     ${timestamp}`,
      `Role:     ${meta.role}`,
      `Schema:   ${meta.schema}`,
      `Ref:      ${meta.id}`,
      "",
      divider,
      "OBJECTIVE",
      divider,
      meta.task,
      "",
      divider,
      "GENERATED PROMPT OUTPUT",
      divider,
      "",
      prompt,
      "",
      divider,
      "END OF REPORT",
      divider,
    ].join("\n");
  }

  if (template === "technical_design") {
    return [
      divider,
      "TECHNICAL DESIGN DOCUMENT",
      divider,
      "",
      "Document Metadata",
      `  Generated:  ${timestamp}`,
      `  Role:       ${meta.role}`,
      `  Schema:     ${meta.schema}`,
      `  Version ID: ${meta.id}`,
      "",
      divider,
      "1. REQUIREMENTS & TASK DEFINITION",
      divider,
      meta.task,
      "",
      divider,
      "2. ANALYSIS & DESIGN OUTPUT",
      divider,
      "",
      prompt,
      "",
      divider,
      "3. NEXT STEPS",
      divider,
      "[ ] Review generated output against requirements",
      "[ ] Validate constraints and trade-offs",
      "[ ] Obtain stakeholder sign-off",
      "",
      divider,
      "END OF DOCUMENT",
      divider,
    ].join("\n");
  }

  if (template === "security_assessment") {
    return [
      divider,
      "SECURITY ASSESSMENT REPORT",
      divider,
      "",
      `Assessment Date: ${timestamp}`,
      `Assessor Role:   ${meta.role}`,
      `Schema Used:     ${meta.schema}`,
      `Report ID:       ${meta.id}`,
      "",
      divider,
      "SCOPE",
      divider,
      meta.task,
      "",
      divider,
      "FINDINGS & ANALYSIS",
      divider,
      "",
      prompt,
      "",
      divider,
      "RECOMMENDATIONS",
      divider,
      "Refer to the analysis above for detailed recommendations.",
      "",
      divider,
      "END OF ASSESSMENT",
      divider,
    ].join("\n");
  }

  return prompt;
}

/* ── Main App ── */
export default function App() {
  const [roles, setRoles] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [schema, setSchema] = useState("");
  const [task, setTask] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [security, setSecurity] = useState<string[]>([]);
  const [reportTemplate, setReportTemplate] = useState("none");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityStep[]>([]);
  const [statusText, setStatusText] = useState("Ready");
  const [statusType, setStatusType] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [genTime, setGenTime] = useState<number | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);

  /* ── Load roles & schemas ── */
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

  /* ── Close export dropdown on outside click ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  /* ── Generate handler with activity tracking ── */
  async function onGenerate() {
    if (!task.trim()) return;

    const startTime = Date.now();
    setLoading(true);
    setError("");
    setResult(null);
    setGenTime(null);
    setStatusText("Generating...");
    setStatusType("loading");

    const steps: ActivityStep[] = [
      { label: "Validating inputs", status: "active" },
      { label: "Loading role & schema", status: "pending" },
      { label: "Assembling prompt", status: "pending" },
      { label: "Finalising output", status: "pending" },
    ];
    setActivity([...steps]);

    // Step 1: Validate
    await sleep(200);
    steps[0] = { ...steps[0], status: "done", elapsed: Date.now() - startTime };
    steps[1] = { ...steps[1], status: "active" };
    setActivity([...steps]);

    // Step 2: Loading
    await sleep(150);
    steps[1] = { ...steps[1], status: "done", elapsed: Date.now() - startTime };
    steps[2] = { ...steps[2], status: "active" };
    setActivity([...steps]);

    try {
      const res = await generatePrompt(
        role,
        task,
        schema,
        vendors.length > 0 ? vendors : undefined,
        security.length > 0 ? security : undefined,
      );

      steps[2] = { ...steps[2], status: "done", elapsed: Date.now() - startTime };
      steps[3] = { ...steps[3], status: "active" };
      setActivity([...steps]);

      await sleep(100);

      steps[3] = { ...steps[3], status: "done", elapsed: Date.now() - startTime };
      setActivity([...steps]);

      setResult(res);
      const totalMs = Date.now() - startTime;
      setGenTime(totalMs);
      setStatusText(`Generated in ${totalMs}ms`);
      setStatusType("success");
    } catch (err) {
      const failIdx = steps.findIndex((s) => s.status === "active");
      if (failIdx >= 0) {
        steps[failIdx] = {
          ...steps[failIdx],
          status: "error",
          elapsed: Date.now() - startTime,
        };
      }
      setActivity([...steps]);
      setError(err instanceof Error ? err.message : String(err));
      setStatusText("Generation failed");
      setStatusType("error");
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

  /* ── Copy to clipboard ── */
  async function onCopy() {
    if (!result) return;
    const content = getExportContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Export helpers ── */
  function getExportContent(): string {
    if (!result) return "";
    if (reportTemplate !== "none") {
      return formatReport(reportTemplate, result.prompt, {
        role,
        schema,
        task,
        id: result.id,
      });
    }
    return result.prompt;
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onExportText() {
    const content = getExportContent();
    const ext = reportTemplate !== "none" ? "report" : "prompt";
    downloadFile(content, `meta-prompt-${ext}-${Date.now()}.txt`);
    setExportOpen(false);
    showToast("Exported as text file");
  }

  function onExportMarkdown() {
    if (!result) return;
    const meta = [
      `# Meta Prompt ${reportTemplate !== "none" ? "Report" : "Output"}`,
      "",
      `| Field | Value |`,
      `|-------|-------|`,
      `| **Role** | ${role} |`,
      `| **Schema** | ${schema} |`,
      `| **ID** | \`${result.id}\` |`,
      `| **Generated** | ${new Date().toISOString()} |`,
      reportTemplate !== "none"
        ? `| **Template** | ${REPORT_TEMPLATES.find((t) => t.value === reportTemplate)?.label} |`
        : "",
      "",
      "## Task",
      "",
      task,
      "",
      "## Output",
      "",
      "```",
      result.prompt,
      "```",
    ]
      .filter(Boolean)
      .join("\n");

    const ext = reportTemplate !== "none" ? "report" : "prompt";
    downloadFile(meta, `meta-prompt-${ext}-${Date.now()}.md`);
    setExportOpen(false);
    showToast("Exported as Markdown");
  }

  function onExportJSON() {
    if (!result) return;
    const payload = {
      id: result.id,
      role,
      schema,
      task,
      template: reportTemplate !== "none" ? reportTemplate : undefined,
      prompt: result.prompt,
      generated_at: new Date().toISOString(),
    };
    const content = JSON.stringify(payload, null, 2);
    downloadFile(content, `meta-prompt-${Date.now()}.json`);
    setExportOpen(false);
    showToast("Exported as JSON");
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
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">MP</div>
          <h1>Meta Prompt Generator</h1>
        </div>
        <span className="version-badge">v1.0</span>
      </header>

      <div className="app-body">
        {/* ── Left: Input sidebar ── */}
        <aside className="sidebar">
          {/* Configuration */}
          <div className="card">
            <h2 className="card-title">
              <span className="card-title-icon">&#9881;</span>
              Configuration
            </h2>

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

          {/* Overlays */}
          <div className="card">
            <h2 className="card-title">
              <span className="card-title-icon">&#9878;</span>
              Overlays
            </h2>

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

          {/* Report Template */}
          <div className="card">
            <h2 className="card-title">
              <span className="card-title-icon">&#128196;</span>
              Report Template
            </h2>
            <div className="field">
              <label className="field-label" htmlFor="template-select">
                Template
              </label>
              <div className="template-select-row">
                <select
                  id="template-select"
                  value={reportTemplate}
                  onChange={(e) => setReportTemplate(e.target.value)}
                >
                  {REPORT_TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {reportTemplate !== "none" && (
                  <span className="template-badge">Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Task */}
          <div className="card">
            <h2 className="card-title">
              <span className="card-title-icon">&#9998;</span>
              Task
            </h2>
            <div className="field">
              <textarea
                id="task-input"
                placeholder="Describe the task... e.g. Design a zero-trust network architecture for a multi-cloud environment"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Task description"
              />
              <div className="field-footer">
                <span className="char-count">{task.length} chars</span>
              </div>
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

          {/* Activity log */}
          {activity.length > 0 && (
            <div className="activity-log">
              {activity.map((step, i) => (
                <div key={i} className="activity-item">
                  <span className={`activity-dot ${step.status}`} />
                  <span>{step.label}</span>
                  {step.elapsed != null && (
                    <span className="activity-time">{step.elapsed}ms</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Right: Output panel ── */}
        <section className="output-panel">
          <div className="output-toolbar">
            <div className="output-toolbar-left">
              <span className="label">Output</span>
              {result && (
                <span className="prompt-id" title={result.id}>
                  {result.id}
                </span>
              )}
            </div>
            <div className="output-actions">
              {result && (
                <>
                  <button
                    className={`btn-action ${copied ? "success" : ""}`}
                    onClick={onCopy}
                  >
                    <span className="btn-icon-char">
                      {copied ? "\u2713" : "\u2398"}
                    </span>
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <div className="export-menu-wrapper" ref={exportRef}>
                    <button
                      className="btn-action"
                      onClick={() => setExportOpen(!exportOpen)}
                    >
                      <span className="btn-icon-char">&darr;</span>
                      Export
                    </button>
                    {exportOpen && (
                      <div className="export-dropdown">
                        <button onClick={onExportText}>
                          <span className="export-dropdown-icon">&#128462;</span>
                          Plain Text (.txt)
                        </button>
                        <button onClick={onExportMarkdown}>
                          <span className="export-dropdown-icon">&#128221;</span>
                          Markdown (.md)
                        </button>
                        <button onClick={onExportJSON}>
                          <span className="export-dropdown-icon">&#123;&#125;</span>
                          JSON (.json)
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-banner-icon">&#9888;</span>
              <span>{error}</span>
            </div>
          )}

          {!result && !error && (
            <div className="output-empty">
              <div className="output-empty-icon">&gt;_</div>
              <h3>No output yet</h3>
              <p>
                Configure a role, schema, and task, then click Generate to
                assemble your prompt.
              </p>
            </div>
          )}

          {result && (
            <div className="output-scroll">
              <pre className="output-prompt" aria-live="polite">
                {highlightPrompt(
                  reportTemplate !== "none"
                    ? formatReport(reportTemplate, result.prompt, {
                        role,
                        schema,
                        task,
                        id: result.id,
                      })
                    : result.prompt,
                )}
              </pre>
            </div>
          )}

          {/* Status bar */}
          <div className="status-bar">
            <span className={`status-indicator ${statusType}`} />
            <span className="status-text">{statusText}</span>
            {genTime != null && (
              <span className="status-meta">{genTime}ms</span>
            )}
          </div>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

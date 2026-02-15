import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  listGovernedReports,
  fetchGovernedReport,
  exportGovernedReport
} from "./api";

function isMarkdown(file: string) {
  return file.toLowerCase().endsWith(".md");
}

function isExportOnly(file: string) {
  const f = file.toLowerCase();
  return f.endsWith(".docx") || f.endsWith(".pdf");
}

export default function GovernedReportViewer() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const sorted = useMemo(() => [...files].sort(), [files]);

  async function refresh() {
    setError("");
    try {
      const list = await listGovernedReports();
      setFiles(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load governed reports");
    }
  }

  async function openFile(file: string) {
    setError("");
    setSelected(file);
    setContent("");

    if (!isMarkdown(file)) return;

    try {
      const md = await fetchGovernedReport(file);
      setContent(md);
    } catch (e: any) {
      setError(e?.message || "Failed to load report content");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3>Governed CTO Strategy Reports</h3>

      {/* GREEN BANNER */}
      <div
        style={{
          background: "#0b1b2b",
          border: "1px solid #00ff88",
          padding: "0.75rem 1rem",
          borderRadius: 8,
          margin: "0.75rem 0 1rem 0",
          color: "#00ff88"
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          Governance Output Rules
        </div>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>.md files are previewed inline.</li>
          <li>.docx / .pdf are export-only.</li>
          <li>All outputs are governed and ledger recorded.</li>
        </ul>
      </div>

      <button onClick={refresh}>Refresh List</button>

      {error && (
        <p style={{ color: "#ff4444", fontWeight: "bold" }}>{error}</p>
      )}

      <ul style={{ marginTop: "1rem" }}>
        {sorted.map((f) => (
          <li key={f} style={{ marginBottom: "0.5rem" }}>
            <button onClick={() => openFile(f)}>{f}</button>{" "}
            <button onClick={() => exportGovernedReport(f, "docx")}>
              Word
            </button>{" "}
            <button onClick={() => exportGovernedReport(f, "pdf")}>
              PDF
            </button>
          </li>
        ))}
      </ul>

      {selected && !isMarkdown(selected) && (
        <div style={{ marginTop: "1rem", color: "#00ff88" }}>
          Preview disabled — export only.
        </div>
      )}

      {content && (
        <div style={{ marginTop: "1rem" }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}

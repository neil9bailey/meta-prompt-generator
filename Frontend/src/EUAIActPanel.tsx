import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  generateEUAIActDerived,
  listDerivedReports,
  fetchDerivedReport,
  exportDerivedReport
} from "./api";

export default function EUAIActPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "error">("idle");

  // -----------------------------
  // Load existing derived artefacts
  // -----------------------------
  useEffect(() => {
    listDerivedReports()
      .then(setFiles)
      .catch(() => setStatus("error"));
  }, []);

  // -----------------------------
  // Generate on demand (admin only)
  // -----------------------------
  async function handleGenerate() {
    try {
      await generateEUAIActDerived();
      const list = await listDerivedReports();
      setFiles(list);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function load(file: string) {
    setContent(await fetchDerivedReport(file));
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3>EU AI Act Compliance (Derived Evidence)</h3>

      <p>
        These artefacts are deterministically derived from governance contracts,
        execution metadata, and immutable ledger entries. No AI systems are
        involved in their generation.
      </p>

      <button onClick={handleGenerate}>
        Generate EU AI Act Compliance Reports
      </button>

      {status === "error" && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Access denied or generation failed. Admin role required.
        </p>
      )}

      <ul>
        {files.map((f) => (
          <li key={f}>
            <button onClick={() => load(f)}>{f}</button>{" "}
            <button onClick={() => exportDerivedReport(f, "docx")}>
              Word
            </button>{" "}
            <button onClick={() => exportDerivedReport(f, "pdf")}>
              PDF
            </button>
          </li>
        ))}
      </ul>

      {content && (
        <div style={{ marginTop: "1rem" }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}

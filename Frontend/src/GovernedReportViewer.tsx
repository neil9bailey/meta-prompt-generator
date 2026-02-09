import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  listGovernedReports,
  fetchGovernedReport,
  exportGovernedReport,
} from "./api";

import {
  parseGovernanceMetadata,
  GovernanceMetadata,
} from "./parseGovernanceMetadata";

import GovernanceMetadataPanel from "./GovernanceMetadataPanel";

export default function GovernedReportViewer() {
  const [files, setFiles] = useState<string[]>([]);
  const [content, setContent] = useState<string>("");
  const [metadata, setMetadata] = useState<GovernanceMetadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    listGovernedReports().then(setFiles);
  }, []);

  async function load(file: string) {
    const text = await fetchGovernedReport(file);
    setSelectedFile(file);
    setContent(text);
    setMetadata(parseGovernanceMetadata(text));
  }

  return (
    <section>
      <h3>Governed CTO Strategy Reports</h3>

      <ul>
        {files.map((f) => (
          <li key={f}>
            <button onClick={() => load(f)}>{f}</button>
          </li>
        ))}
      </ul>

      {content && metadata && selectedFile && (
        <div style={{ marginTop: "2rem" }}>
          <GovernanceMetadataPanel metadata={metadata} />

          <div style={{ marginBottom: "1rem" }}>
            <strong>Export Governed Output:</strong>{" "}
            <button onClick={() => exportGovernedReport(selectedFile, "docx")}>
              Word
            </button>{" "}
            <button onClick={() => exportGovernedReport(selectedFile, "pdf")}>
              PDF
            </button>
          </div>

          <h4>Governed Output (Read-Only)</h4>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}

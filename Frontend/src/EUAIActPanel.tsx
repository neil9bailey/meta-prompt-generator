import { useEffect, useState } from "react";
import {
  listDerivedReports,
  fetchDerivedReport,
  generateEUAIActDerived
} from "./api";

export default function EUAIActPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  async function loadReports() {
    try {
      const data = await listDerivedReports();
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGenerate() {
    try {
      await generateEUAIActDerived();
      await loadReports();
    } catch (err) {
      console.error(err);
      alert("EU AI Act generation failed");
    }
  }

  async function openFile(file: string) {
    try {
      const text = await fetchDerivedReport(file);
      setSelectedFile(file);
      setContent(text);
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>EU AI Act Derived Reports</h2>

      <button
        onClick={handleGenerate}
        style={{
          marginBottom: 15,
          padding: "8px 16px",
          backgroundColor: "#004b8d",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Generate EU AI Act Derived Reports
      </button>

      <h3>Available Reports</h3>

      <ul>
        {files.map((file) => (
          <li key={file}>
            <button
              onClick={() => openFile(file)}
              style={{
                background: "none",
                border: "none",
                color: "#00ff88",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {file}
            </button>
          </li>
        ))}
      </ul>

      {selectedFile && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: "#111",
            color: "#00ff88",
            borderRadius: 6,
            whiteSpace: "pre-wrap"
          }}
        >
          <h3>{selectedFile}</h3>
          <div>{content}</div>
        </div>
      )}
    </div>
  );
}

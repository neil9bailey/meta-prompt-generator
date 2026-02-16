import {
  generateEUAIActDerived,
  listDerivedReports,
  fetchDerivedReport
} from "./api";

import { useEffect, useState } from "react";

export default function RegulatoryDerivations() {
  const [files, setFiles] = useState<string[]>([]);

  async function load() {
    const data = await listDerivedReports();
    setFiles(
      data.filter(f => f.endsWith(".md"))
    );
  }

  async function generate() {
    await generateEUAIActDerived();
    await load();
  }

  async function openFile(name: string) {
    const content = await fetchDerivedReport(name);
    alert(content);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="panel">
      <h2>Regulatory & Compliance Derivations</h2>

      <button className="btn-primary" onClick={generate}>
        Generate Compliance Derivation
      </button>

      <div className="console-box">
        {files.map(f => (
          <div key={f}>
            <button
              className="link-btn"
              onClick={() => openFile(f)}
            >
              {f}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

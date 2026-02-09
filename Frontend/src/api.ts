const BACKEND_BASE = "http://localhost:3001";

// -----------------------------
// Shared RBAC headers
// -----------------------------
function authHeaders(role: "viewer" | "govern" | "admin") {
  return {
    "Content-Type": "application/json",
    "x-api-key": "demo-key",
    "x-role": role,
  };
}

// -----------------------------
// Run deterministic governance
// -----------------------------
export async function runGovernedCtoStrategy(provider: string) {
  const res = await fetch(
    `${BACKEND_BASE}/govern/cto-strategy?provider=${encodeURIComponent(
      provider
    )}`,
    {
      method: "POST",
      headers: authHeaders("govern"),
    }
  );

  if (!res.ok) {
    throw new Error("Governance execution failed");
  }

  return res.json();
}

// -----------------------------
// List governed reports
// -----------------------------
export async function listGovernedReports(): Promise<string[]> {
  const res = await fetch(`${BACKEND_BASE}/reports`, {
    headers: authHeaders("viewer"),
  });

  if (!res.ok) {
    throw new Error("Failed to list governed reports");
  }

  return res.json();
}

// -----------------------------
// Fetch governed report content
// -----------------------------
export async function fetchGovernedReport(file: string): Promise<string> {
  const res = await fetch(`${BACKEND_BASE}/reports/${file}`, {
    headers: authHeaders("viewer"),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch governed report");
  }

  return res.text();
}

// -----------------------------
// Export governed report
// -----------------------------
export function exportGovernedReport(
  file: string,
  format: "docx" | "pdf"
) {
  window.open(
    `${BACKEND_BASE}/export/${encodeURIComponent(file)}/${format}`,
    "_blank"
  );
}

// -----------------------------
// Trust dashboard
// -----------------------------
export async function fetchTrustDashboard() {
  const res = await fetch(`${BACKEND_BASE}/trust`, {
    headers: authHeaders("admin"),
  });

  if (!res.ok) {
    throw new Error("Access denied");
  }

  return res.json();
}

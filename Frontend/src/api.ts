const BACKEND_BASE = "http://localhost:3001";

/* ===============================
   AUTH / RBAC HEADERS
================================ */

function viewerHeaders() {
  return {
    "x-api-key": "viewer",
    "x-role": "viewer",
  };
}

function adminHeaders() {
  return {
    "x-api-key": "admin",
    "x-role": "admin",
  };
}

/* ===============================
   GOVERNED EXECUTION
================================ */

export async function runGovernedCtoStrategy(provider: string) {
  const res = await fetch(
    `${BACKEND_BASE}/govern/cto-strategy?provider=${encodeURIComponent(
      provider
    )}`,
    {
      method: "POST",
      headers: adminHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error("Governance execution failed");
  }

  return res.json();
}

/* ===============================
   GOVERNED REPORTS
================================ */

export async function listGovernedReports(): Promise<string[]> {
  const res = await fetch(`${BACKEND_BASE}/reports`, {
    headers: viewerHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to list governed reports");
  }

  return res.json();
}

export async function fetchGovernedReport(file: string): Promise<string> {
  const res = await fetch(`${BACKEND_BASE}/reports/${file}`, {
    headers: viewerHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch governed report");
  }

  return res.text();
}

export function exportGovernedReport(
  file: string,
  format: "docx" | "pdf"
) {
  window.open(
    `${BACKEND_BASE}/export/${encodeURIComponent(file)}/${format}`,
    "_blank"
  );
}

/* ===============================
   TRUST DASHBOARD
================================ */

export async function fetchTrustDashboard() {
  const res = await fetch(`${BACKEND_BASE}/trust`, {
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trust dashboard");
  }

  return res.json();
}

/* ===============================
   EU AI ACT — DERIVED ARTEFACTS
================================ */

export async function generateEUAIActDerived() {
  const res = await fetch(`${BACKEND_BASE}/derived/eu-ai-act`, {
    method: "POST",
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to generate EU AI Act derived artefacts");
  }

  return res.json();
}

export async function listDerivedReports(): Promise<string[]> {
  const res = await fetch(`${BACKEND_BASE}/derived`, {
    headers: viewerHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to list derived artefacts");
  }

  return res.json();
}

export async function fetchDerivedReport(file: string): Promise<string> {
  const res = await fetch(`${BACKEND_BASE}/derived/${file}`, {
    headers: viewerHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch derived artefact");
  }

  return res.text();
}

export function exportDerivedReport(
  file: string,
  format: "docx" | "pdf"
) {
  window.open(
    `${BACKEND_BASE}/derived/export/${encodeURIComponent(file)}/${format}`,
    "_blank"
  );
}

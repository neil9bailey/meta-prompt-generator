const BACKEND_BASE = "http://localhost:3001";

/* =========================================================
   Internal helper (RBAC fixed)
   ========================================================= */

async function backendFetch(
  url: string,
  options: RequestInit = {}
) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-role": "admin",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res;
}

/* =========================================================
   GOVERNANCE — CTO STRATEGY
   ========================================================= */

export async function runGovernedCtoStrategy(provider: string) {
  const res = await backendFetch(
    `${BACKEND_BASE}/govern/cto-strategy?provider=${provider}`,
    { method: "POST" }
  );
  return res.json();
}

/* =========================================================
   GOVERNED REPORTS
   ========================================================= */

export async function listGovernedReports() {
  const res = await backendFetch(
    `${BACKEND_BASE}/reports`
  );
  return res.json();
}

export async function fetchGovernedReport(file: string) {
  const res = await backendFetch(
    `${BACKEND_BASE}/reports/${file}`
  );
  return res.text();
}

export async function exportGovernedReport(
  file: string,
  format: "pdf" | "docx"
) {
  const res = await backendFetch(
    `${BACKEND_BASE}/export/${file}/${format}`
  );
  return res.blob();
}

/* =========================================================
   DERIVED — EU AI ACT
   ========================================================= */

export async function generateEUAIActDerived() {
  const res = await backendFetch(
    `${BACKEND_BASE}/derived/eu-ai-act`,
    { method: "POST" }
  );
  return res.json();
}

export async function listDerivedReports() {
  const res = await backendFetch(
    `${BACKEND_BASE}/derived`
  );
  return res.json();
}

export async function fetchDerivedReport(file: string) {
  const res = await backendFetch(
    `${BACKEND_BASE}/derived/${file}`
  );
  return res.text();
}

export async function exportDerivedReport(
  file: string,
  format: "pdf" | "docx"
) {
  const res = await backendFetch(
    `${BACKEND_BASE}/export/${file}/${format}`
  );
  return res.blob();
}

/* =========================================================
   TRUST DASHBOARD
   ========================================================= */

export async function fetchTrustDashboard() {
  const res = await backendFetch(
    `${BACKEND_BASE}/trust`
  );
  return res.json();
}

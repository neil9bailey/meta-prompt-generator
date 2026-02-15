const BASE_URL = "http://localhost:3001";

const headers = {
  "Content-Type": "application/json",
  "x-role": "admin"
};

/* =====================================================
   GOVERNED EXECUTION
===================================================== */

export async function runGovernedCtoStrategy(provider: string) {
  const res = await fetch(
    `${BASE_URL}/govern/cto-strategy?provider=${encodeURIComponent(provider)}`,
    {
      method: "POST",
      headers
    }
  );

  if (!res.ok) throw new Error("Governed execution failed");
  return res.json();
}

/* =====================================================
   GOVERNED REPORTS
===================================================== */

export async function listGovernedReports() {
  const res = await fetch(`${BASE_URL}/reports`, { headers });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function fetchGovernedReport(file: string) {
  const res = await fetch(`${BASE_URL}/reports/${file}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.text();
}

export function exportGovernedReport(file: string) {
  window.open(`${BASE_URL}/reports/${file}`, "_blank");
}

/* =====================================================
   DERIVED — EU AI ACT
===================================================== */

export async function generateEUAIActDerived() {
  const res = await fetch(`${BASE_URL}/derived/eu-ai-act`, {
    method: "POST",
    headers
  });
  if (!res.ok) throw new Error("Failed to generate derived reports");
  return res.json();
}

export async function listDerivedReports() {
  const res = await fetch(`${BASE_URL}/derived`, { headers });
  if (!res.ok) throw new Error("Failed to list derived reports");
  return res.json();
}

export async function fetchDerivedReport(file: string) {
  const res = await fetch(`${BASE_URL}/derived/${file}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch derived report");
  return res.text();
}

/* =====================================================
   TRUST DASHBOARD
===================================================== */

export async function fetchTrustDashboard() {
  const res = await fetch(`${BASE_URL}/trust`, { headers });
  if (!res.ok) throw new Error("Failed to fetch trust dashboard");
  return res.json();
}

/* =====================================================
   POLICY IMPACT
===================================================== */

export async function runPolicyImpact() {
  const res = await fetch(`${BASE_URL}/api/impact/policy`, {
    method: "POST",
    headers
  });

  if (!res.ok) throw new Error("Impact analysis failed");
  return res.json();
}

/* =====================================================
   HUMAN INTENT
===================================================== */

export async function listHumanInputs() {
  const res = await fetch(`${BASE_URL}/api/human-input`, { headers });
  if (!res.ok) throw new Error("Failed to list human inputs");
  return res.json();
}

export async function createHumanInput(payload: any) {
  const res = await fetch(`${BASE_URL}/api/human-input`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Human intent capture failed");
  return res.json();
}

export async function executeHumanInput(id: string, provider: string) {
  const res = await fetch(
    `${BASE_URL}/api/human-input/${id}/execute`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ provider })
    }
  );

  if (!res.ok) throw new Error("Human execution failed");
  return res.json();
}

const BACKEND = "http://localhost:3001";

/* ================= GOVERNED EXECUTION ================= */

export async function runGovernedCtoStrategy(provider: string) {
  const res = await fetch(
    `${BACKEND}/govern/cto-strategy?provider=${encodeURIComponent(provider)}`,
    {
      method: "POST",
      headers: { "x-role": "admin" }
    }
  );

  if (!res.ok) {
    throw new Error("Governed execution failed");
  }

  return res.json();
}

/* ================= GOVERNED REPORTS ================= */

export async function listGovernedReports() {
  const res = await fetch(`${BACKEND}/reports`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to list governed reports");
  }

  return res.json();
}

export async function fetchGovernedReport(file: string) {
  const res = await fetch(`${BACKEND}/reports/${file}`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch governed report");
  }

  return res.text();
}

export function exportGovernedReport(file: string) {
  window.open(`${BACKEND}/reports/${file}`, "_blank");
}

/* ================= DERIVED REPORTS ================= */

export async function listDerivedReports() {
  const res = await fetch(`${BACKEND}/derived`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to list derived reports");
  }

  return res.json();
}

export async function fetchDerivedReport(file: string) {
  const res = await fetch(`${BACKEND}/derived/${file}`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch derived report");
  }

  return res.text();
}

export async function generateEUAIActDerived() {
  const res = await fetch(`${BACKEND}/derived/eu-ai-act`, {
    method: "POST",
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Derived generation failed");
  }

  return res.json();
}

/* ================= HUMAN INPUT ================= */

export async function createHumanInput(data: any) {
  const res = await fetch(`${BACKEND}/api/human-input`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-role": "admin"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Failed to create human input");
  }

  return res.json();
}

export async function listHumanInputs() {
  const res = await fetch(`${BACKEND}/api/human-input`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to list human inputs");
  }

  return res.json();
}

/* ================= POLICY IMPACT ================= */

export async function runPolicyImpact() {
  const res = await fetch(`${BACKEND}/api/impact/policy`, {
    method: "POST",
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Policy impact failed");
  }

  return res.json();
}

/* ================= TRUST ================= */

export async function fetchTrustDashboard() {
  const res = await fetch(`${BACKEND}/trust`, {
    headers: { "x-role": "admin" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trust dashboard");
  }

  return res.json();
}

/**
 * VendorLogic DIIaC v1.1.0 (Clean)
 * API client — ExecutionAdapter aligned
 */

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined at build time");
}

export interface GenerateRequest {
  execution_schema: string;
  role: string;
  intent: string;
  input: Record<string, any>;
  options: Record<string, any>;
}

export async function generatePrompt(payload: GenerateRequest) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

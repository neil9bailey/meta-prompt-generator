const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface GenerateResult {
  prompt: string;
  id: string;
}

export interface GenerateError {
  error: string;
  message: string;
}

export async function generatePrompt(
  role: string,
  task: string,
  schema: string,
  vendors?: string[],
  security?: string[],
): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, task, schema, vendors, security }),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as GenerateError;
    throw new Error(err.message || "Prompt generation failed");
  }

  return data as GenerateResult;
}

export async function fetchRoles(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/roles`);
  if (!res.ok) throw new Error("Failed to load roles");
  return res.json();
}

export async function fetchSchemas(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/schemas`);
  if (!res.ok) throw new Error("Failed to load schemas");
  return res.json();
}

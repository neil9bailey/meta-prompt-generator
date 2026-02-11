const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function generatePrompt(
  role: string,
  task: string,
  schema: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, task, schema }),
  });

  if (!res.ok) {
    throw new Error("Prompt generation failed");
  }

  const data = await res.json();
  return data.prompt;
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

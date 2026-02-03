export interface Role {
  id: string;
  title?: string;
  description?: string;
}

export interface Schema {
  id: string;
  description?: string;
  structure?: string;
}

export interface GenerateRequest {
  role: string;
  schema_id: string;
  intent: string;
  input: Record<string, unknown>;
}

export interface GenerateResponse {
  prompt: string;
}

const API_BASE = "http://localhost:8100/api";

export async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_BASE}/roles`);
  if (!res.ok) {
    throw new Error("Failed to fetch roles");
  }
  return res.json();
}

export async function fetchSchemas(): Promise<Schema[]> {
  const res = await fetch(`${API_BASE}/schemas`);
  if (!res.ok) {
    throw new Error("Failed to fetch schemas");
  }
  return res.json();
}

export async function generatePrompt(
  payload: GenerateRequest
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to generate prompt");
  }

  return res.json();
}

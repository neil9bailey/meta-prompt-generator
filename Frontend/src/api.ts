export async function runGovernedCtoStrategy(): Promise<{
  status: string;
  message: string;
  artefactPath?: string;
}> {
  const response = await fetch("http://localhost:3001/govern/cto-strategy", {
    method: "POST",
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error("Backend returned invalid JSON");
  }

  if (!response.ok || data.status !== "ok") {
    throw new Error(data.message || "Governed execution failed");
  }

  return data;
}

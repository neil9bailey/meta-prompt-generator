import { useEffect, useState } from "react";
import {
  listHumanInputs,
  createHumanInput,
  executeHumanInput
} from "./api";

interface HumanInput {
  input_id: string;
  title?: string;
  policy_id?: string;
  timestamp?: string;
}

export default function HumanIntentPanel() {
  const [inputs, setInputs] = useState<HumanInput[]>([]);
  const [title, setTitle] = useState("");

  async function refresh() {
    const data = await listHumanInputs();
    setInputs(Array.isArray(data) ? data : []);
  }

  async function handleCreate() {
    if (!title.trim()) return;

    await createHumanInput({
      title,
      policy_id: "CTO_STRATEGY_BASELINE"
    });

    setTitle("");
    await refresh();
  }

  async function handleExecute(id: string) {
    await executeHumanInput(id, "ChatGPT");
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section>
      <h2>Human Intent</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter intent..."
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      <div>
        {inputs.map((input, index) => {
          const safeKey =
            input?.input_id
              ? input.input_id
              : `fallback-${index}`;

          return (
            <div
              key={safeKey}
              style={{
                border: "1px solid #444",
                padding: "0.5rem",
                marginBottom: "0.5rem"
              }}
            >
              <strong>{input?.title || "Untitled"}</strong>
              <div>ID: {input?.input_id}</div>
              <div>{input?.timestamp}</div>
              <button
                onClick={() =>
                  input?.input_id &&
                  handleExecute(input.input_id)
                }
              >
                Execute
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

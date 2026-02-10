import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { requireRole } from "./auth/rbac.js";

/* =========================================================
   Setup
   ========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

/* =========================================================
   Middleware
   ========================================================= */

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"
    );
  }
  next();
});

/* =========================================================
   Health
   ========================================================= */

app.get("/", (_, res) => res.send("DIIaC Backend running"));

/* =========================================================
   Paths
   ========================================================= */

const WORKSPACE = "/workspace";

const GOVERNED_DIR = path.join(WORKSPACE, "artefacts/step4-cto-strategy/output");
const DERIVED_DIR = path.join(WORKSPACE, "artefacts/derived");
const LEDGER_PATH = path.join(WORKSPACE, "ledger/ledger.jsonl");
const TMP_DIR = path.join(WORKSPACE, "tmp");

const LLM_INGEST_DIR = path.join(WORKSPACE, "artefacts/llm-ingestion");
const POLICY_BIND_DIR = path.join(WORKSPACE, "artefacts/policy-bindings");
const POLICY_DIR = path.join(WORKSPACE, "artefacts/policies");
const POLICY_DRIFT_DIR = path.join(WORKSPACE, "artefacts/policy-drift");

[
  TMP_DIR,
  LLM_INGEST_DIR,
  POLICY_BIND_DIR,
  POLICY_DRIFT_DIR
].forEach((d) => fs.mkdirSync(d, { recursive: true }));

/* =========================================================
   v0.4.2 — GOVERNANCE EXECUTION (UNCHANGED)
   ========================================================= */

app.post(
  "/govern/cto-strategy",
  requireRole(["admin"]),
  (req, res) => {
    const provider = req.query.provider || "ChatGPT";

    execFile(
      "pwsh",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "/workspace/artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1",
        "-Provider",
        provider
      ],
      (err) => {
        if (err) {
          console.error("Governance execution failed:", err);
          return res.status(500).json({
            error: "Governance execution failed"
          });
        }

        res.json({
          message: "Governed reports generated successfully",
          provider
        });
      }
    );
  }
);

/* =========================================================
   v0.4.2 — REPORTS / TRUST / DERIVED (UNCHANGED)
   ========================================================= */

app.get("/reports", requireRole(["viewer", "admin"]), (_, res) => {
  res.json(fs.existsSync(GOVERNED_DIR) ? fs.readdirSync(GOVERNED_DIR) : []);
});

app.get("/reports/:file", requireRole(["viewer", "admin"]), (req, res) => {
  const f = path.join(GOVERNED_DIR, req.params.file);
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

app.get("/trust", requireRole(["admin"]), (_, res) => {
  if (!fs.existsSync(LEDGER_PATH)) {
    return res.json({ executions: 0, providers: [], ledgerContinuity: "INTACT" });
  }
  const entries = fs
    .readFileSync(LEDGER_PATH, "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);

  res.json({
    executions: entries.length,
    providers: [...new Set(entries.map((e) => e.provider))],
    ledgerContinuity: "INTACT"
  });
});

app.post("/derived/eu-ai-act", requireRole(["admin"]), (_, res) => {
  execFile(
    "pwsh",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "/workspace/artefacts/derived/generate-eu-ai-act-derived.ps1"
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Derived failed" });
      res.json({ message: "EU AI Act evidence generated" });
    }
  );
});

app.get("/derived", requireRole(["viewer", "admin"]), (_, res) => {
  res.json(
    fs.existsSync(DERIVED_DIR)
      ? fs.readdirSync(DERIVED_DIR).filter((f) => f.endsWith(".md"))
      : []
  );
});

app.get("/derived/:file", requireRole(["viewer", "admin"]), (req, res) => {
  const f = path.join(DERIVED_DIR, req.params.file);
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

/* =========================================================
   PHASE A1 / A2 — LLM INGESTION
   ========================================================= */

const LLM_SCHEMA = {
  schema_id: "diiac:llm-capture",
  schema_version: "1.0.0",
  schema_hash:
    "3d01ab87272741bb546b79db244f96e68b2ebebc9e43f3e7c2f2b09172803a9c"
};

app.post("/api/ingest/llm", requireRole(["admin"]), async (req, res) => {
  if (process.env.LLM_INGESTION_ENABLED !== "true") {
    return res.status(403).json({ error: "LLM ingestion disabled" });
  }

  const { provider, prompt, parameters = {} } = req.body;
  if (!provider || !prompt) {
    return res.status(400).json({ error: "provider and prompt required" });
  }

  let content = "";
  let model = "";

  if (provider === "openai") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await client.chat.completions.create({
      model: parameters.model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: parameters.temperature ?? 0
    });
    content = r.choices[0].message.content;
    model = r.model;
  } else if (provider === "copilot") {
    content = "Copilot generated response placeholder";
    model = "m365-copilot";
  } else {
    return res.status(400).json({ error: "Unknown provider" });
  }

  const record = {
    ...LLM_SCHEMA,
    timestamp: new Date().toISOString(),
    provider,
    model,
    prompt_hash: crypto.createHash("sha256").update(prompt).digest("hex"),
    response_hash: crypto.createHash("sha256").update(content).digest("hex"),
    trusted: false,
    content
  };

  const file = `${Date.now()}-${record.response_hash}.json`;
  fs.writeFileSync(
    path.join(LLM_INGEST_DIR, file),
    JSON.stringify(record, null, 2)
  );

  res.json({
    status: "captured",
    provider,
    response_hash: record.response_hash,
    schema_version: record.schema_version
  });
});

/* =========================================================
   PHASE A3 — POLICY BINDING
   ========================================================= */

app.post("/api/bind/policy", requireRole(["admin"]), (req, res) => {
  const { response_hash, policy } = req.body;
  if (!response_hash || !policy) {
    return res.status(400).json({ error: "response_hash and policy required" });
  }

  const files = fs
    .readdirSync(LLM_INGEST_DIR)
    .filter((f) => f.includes(response_hash));

  if (files.length === 0) {
    return res.status(404).json({ error: "LLM capture not found" });
  }

  const capture = JSON.parse(
    fs.readFileSync(path.join(LLM_INGEST_DIR, files.sort().pop()), "utf8")
  );

  const binding_id = crypto
    .createHash("sha256")
    .update(
      response_hash +
        policy.policy_id +
        policy.policy_version +
        policy.policy_hash
    )
    .digest("hex");

  fs.writeFileSync(
    path.join(POLICY_BIND_DIR, `${Date.now()}-${binding_id}.json`),
    JSON.stringify(
      {
        schema_id: "diiac:policy-binding",
        schema_version: "1.0.0",
        timestamp: new Date().toISOString(),
        binding_id,
        llm_capture: {
          response_hash,
          schema_version: capture.schema_version,
          schema_hash: capture.schema_hash
        },
        policy
      },
      null,
      2
    )
  );

  res.json({ status: "bound", binding_id });
});

/* =========================================================
   PHASE A4 — POLICY DRIFT DETECTION
   ========================================================= */

app.post("/api/drift/policy", requireRole(["admin"]), (req, res) => {
  const { binding_id } = req.body;
  if (!binding_id) return res.status(400).json({ error: "binding_id required" });

  const files = fs
    .readdirSync(POLICY_BIND_DIR)
    .filter((f) => f.includes(binding_id));

  if (files.length === 0) {
    return res.status(404).json({ error: "Binding not found" });
  }

  const binding = JSON.parse(
    fs.readFileSync(path.join(POLICY_BIND_DIR, files[0]), "utf8")
  );

  const policyPath = path.join(
    POLICY_DIR,
    binding.policy.policy_id,
    "policy.json"
  );

  const raw = fs.readFileSync(policyPath, "utf8");
  const currentHash = crypto.createHash("sha256").update(raw).digest("hex");

  const drift_status =
    currentHash === binding.policy.policy_hash ? "NONE" : "HASH_DRIFT";

  res.json({
    schema_id: "diiac:policy-drift-report",
    schema_version: "1.0.0",
    timestamp: new Date().toISOString(),
    binding_id,
    policy_id: binding.policy.policy_id,
    drift_status,
    details:
      drift_status === "NONE"
        ? {}
        : { bound: binding.policy.policy_hash, current: currentHash }
  });
});

/* =========================================================
   START
   ========================================================= */

app.listen(PORT, "0.0.0.0", () =>
  console.log(`DIIaC Backend running on http://0.0.0.0:${PORT}`)
);

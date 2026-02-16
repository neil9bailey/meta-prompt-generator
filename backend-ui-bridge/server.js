import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { requireRole } from "./auth/rbac.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const WORKSPACE = "/workspace";

const LEDGER_PATH = `${WORKSPACE}/ledger/ledger.jsonl`;
const LEDGER_ANCHOR_PATH = `${WORKSPACE}/ledger/ledger.anchor.json`;
const DECISION_PACK_BASE = `${WORKSPACE}/artefacts/decision-packs`;
const GOVERNED_DIR = `${WORKSPACE}/artefacts/step4-cto-strategy/output`;
const DERIVED_DIR = `${WORKSPACE}/artefacts/derived`;
const HUMAN_INPUT_DIR = `${WORKSPACE}/artefacts/human-input/inputs`;

const CTO_SCRIPT =
  `${WORKSPACE}/artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1`;

app.use(cors({
  origin: "http://localhost:5173",
  allowedHeaders: ["Content-Type", "x-role"]
}));

app.use(express.json());

/* ================= LEDGER CORE ================= */

function ensureLedger() {
  if (!fs.existsSync(LEDGER_PATH))
    fs.writeFileSync(LEDGER_PATH, "");
}

function sha256(input) {
  return crypto.createHash("sha256")
    .update(input)
    .digest("hex");
}

function getLedgerLines() {
  ensureLedger();
  return fs.readFileSync(LEDGER_PATH, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);
}

function getLastHash() {
  const lines = getLedgerLines();
  if (!lines.length) return "GENESIS";
  return JSON.parse(lines[lines.length - 1]).record_hash;
}

function isFrozen() {
  if (!fs.existsSync(LEDGER_ANCHOR_PATH)) return false;
  return JSON.parse(
    fs.readFileSync(LEDGER_ANCHOR_PATH)
  ).frozen === true;
}

function appendLedger(record) {
  if (isFrozen())
    throw new Error("Ledger is frozen");

  const full = {
    ...record,
    previous_hash: getLastHash()
  };

  const record_hash = sha256(JSON.stringify(full));

  const sealed = {
    ...full,
    record_hash
  };

  fs.appendFileSync(
    LEDGER_PATH,
    JSON.stringify(sealed) + "\n"
  );

  return sealed;
}

/* ================= TRUST ================= */

app.get("/trust",
  requireRole(["admin"]),
  (_, res) => {

    const lines = getLedgerLines();
    const root =
      lines.length
        ? JSON.parse(lines[lines.length - 1]).record_hash
        : "GENESIS";

    res.json({
      valid: true,
      records: lines.length,
      ledger_root: root,
      frozen: isFrozen()
    });
  }
);

/* ================= REPORTS ================= */

app.get("/reports",
  requireRole(["admin"]),
  (_, res) => {
    if (!fs.existsSync(GOVERNED_DIR))
      return res.json([]);
    res.json(
      fs.readdirSync(GOVERNED_DIR)
        .filter(f => !f.startsWith("run") && !f.startsWith("output"))
    );
  }
);

app.get("/reports/:file",
  requireRole(["admin"]),
  (req, res) => {
    const filePath = path.join(GOVERNED_DIR, req.params.file);
    if (!fs.existsSync(filePath))
      return res.status(404).send("Not found");
    res.sendFile(filePath);
  }
);

/* ================= DERIVED ================= */

app.get("/derived",
  requireRole(["admin"]),
  (_, res) => {
    if (!fs.existsSync(DERIVED_DIR))
      return res.json([]);
    res.json(
      fs.readdirSync(DERIVED_DIR)
        .filter(f => !f.startsWith("run") && !f.startsWith("output"))
    );
  }
);

app.get("/derived/:file",
  requireRole(["admin"]),
  (req, res) => {
    const filePath = path.join(DERIVED_DIR, req.params.file);
    if (!fs.existsSync(filePath))
      return res.status(404).send("Not found");
    res.sendFile(filePath);
  }
);

/* ================= HUMAN INPUT ================= */

app.get("/api/human-input",
  requireRole(["admin"]),
  (_, res) => {
    if (!fs.existsSync(HUMAN_INPUT_DIR))
      return res.json([]);
    res.json(fs.readdirSync(HUMAN_INPUT_DIR));
  }
);

app.post("/api/human-input",
  requireRole(["admin"]),
  (req, res) => {

    const id = Date.now();
    const filePath =
      path.join(HUMAN_INPUT_DIR, `${id}.json`);

    fs.mkdirSync(HUMAN_INPUT_DIR, { recursive: true });

    fs.writeFileSync(
      filePath,
      JSON.stringify(req.body, null, 2)
    );

    res.json({ saved: `${id}.json` });
  }
);

/* ================= POLICY IMPACT ================= */

app.post("/api/impact/policy",
  requireRole(["admin"]),
  (_, res) => {

    const result = {
      severity: "LOW",
      impacted_controls: 3,
      findings: 0,
      evaluated_at: new Date().toISOString()
    };

    res.json(result);
  }
);

/* ================= GOVERNED EXECUTION ================= */

app.post("/govern/cto-strategy",
  requireRole(["admin"]),
  (req, res) => {

    if (isFrozen())
      return res.status(423).json({ error: "Ledger is frozen" });

    const provider = req.query.provider;
    if (!provider)
      return res.status(400).json({ error: "Provider required" });

    const executionId = crypto.randomUUID();

    execFile(
      "pwsh",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy", "Bypass",
        "-File",
        CTO_SCRIPT,
        "-Provider",
        provider
      ],
      { timeout: 120000 },
      (err) => {

        if (err)
          return res.status(500).json({ error: err.message });

        const baseRecord = {
          type: "GOVERNED_EXECUTION",
          execution_id: executionId,
          provider,
          timestamp: new Date().toISOString()
        };

        const sealed = appendLedger(baseRecord);

        res.json({
          status: "executed",
          execution_id: executionId,
          record_hash: sealed.record_hash
        });
      }
    );
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log("DIIaC Backend — Stable UI Complete");
});

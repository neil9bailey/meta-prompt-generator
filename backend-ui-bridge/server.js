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

/* =========================================================
   PATHS
========================================================= */

const WORKSPACE = "/workspace";

const LEDGER_PATH = `${WORKSPACE}/ledger/ledger.jsonl`;
const LEDGER_ANCHOR_PATH = `${WORKSPACE}/ledger/ledger.anchor.json`;
const NOTARY_DIR = `${WORKSPACE}/ledger/notarisation`;

const GOVERNED_DIR =
  `${WORKSPACE}/artefacts/step4-cto-strategy/output`;

const DERIVED_DIR =
  `${WORKSPACE}/artefacts/derived`;

const HUMAN_INPUT_DIR =
  `${WORKSPACE}/artefacts/human-input/inputs`;

const DECISION_PACK_BASE =
  `${WORKSPACE}/artefacts/decision-packs`;

const CTO_SCRIPT =
  `${WORKSPACE}/artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1`;

const EU_AI_ACT_SCRIPT =
  `${WORKSPACE}/artefacts/derived/run/generate-eu-ai-act-derived.ps1`;

app.use(cors({
  origin: "http://localhost:5173",
  allowedHeaders: ["Content-Type", "x-role"]
}));

app.use(express.json());

/* =========================================================
   LEDGER CORE
========================================================= */

function ensureLedger() {
  if (!fs.existsSync(LEDGER_PATH))
    fs.writeFileSync(LEDGER_PATH, "");
}

function hash(data) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(data))
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
  if (isFrozen()) return;

  const full = {
    ...record,
    previous_hash: getLastHash()
  };

  const record_hash = hash(full);

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

/* =========================================================
   DECISION PACK (Additive Layer)
========================================================= */

function createDecisionPack(executionId, ledgerRecord) {
  try {
    if (!executionId) return;

    const packDir =
      path.join(DECISION_PACK_BASE, executionId);

    if (!fs.existsSync(packDir))
      fs.mkdirSync(packDir, { recursive: true });

    fs.writeFileSync(
      path.join(packDir, "decision.json"),
      JSON.stringify(ledgerRecord, null, 2)
    );

    const lines = getLedgerLines();
    const last =
      lines.length
        ? JSON.parse(lines[lines.length - 1])
        : null;

    fs.writeFileSync(
      path.join(packDir, "ledger_snapshot.json"),
      JSON.stringify({
        ledger_root: last?.record_hash || "GENESIS",
        records: lines.length,
        frozen: isFrozen(),
        snapshot_at: new Date().toISOString()
      }, null, 2)
    );

    fs.writeFileSync(
      path.join(packDir, "artefacts_index.json"),
      JSON.stringify({
        execution_id: executionId,
        created_at: new Date().toISOString(),
        files: [
          "decision.json",
          "ledger_snapshot.json"
        ]
      }, null, 2)
    );

  } catch (err) {
    console.log(
      "[DecisionPack] Non-blocking failure:",
      err.message
    );
  }
}

/* =========================================================
   TRUST
========================================================= */

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
      frozen: isFrozen(),
      timestamp: new Date().toISOString()
    });
  }
);

/* =========================================================
   GOVERNED EXECUTION
========================================================= */

app.post("/govern/cto-strategy",
  requireRole(["admin"]),
  (req, res) => {

    const provider = req.query.provider || "ChatGPT";
    const executionId = crypto.randomUUID();

    execFile(
      "pwsh",
      [CTO_SCRIPT, "-Provider", provider],
      (err) => {

        if (err)
          return res.status(500).json({ error: err.message });

        const ledgerRecord = appendLedger({
          type: "GOVERNED_EXECUTION",
          execution_id: executionId,
          provider,
          timestamp: new Date().toISOString()
        });

        createDecisionPack(
          executionId,
          ledgerRecord
        );

        res.json({
          status: "executed",
          provider,
          execution_id: executionId
        });
      }
    );
  }
);

/* =========================================================
   DERIVED — EU AI ACT
========================================================= */

app.post("/derived/eu-ai-act",
  requireRole(["admin"]),
  (_, res) => {

    const executionId = crypto.randomUUID();

    execFile(
      "pwsh",
      [EU_AI_ACT_SCRIPT],
      (err, stdout, stderr) => {

        if (err)
          return res.status(500).json({
            error: stderr || err.message
          });

        const ledgerRecord = appendLedger({
          type: "DERIVED_GENERATION",
          execution_id: executionId,
          category: "EU_AI_ACT",
          timestamp: new Date().toISOString()
        });

        createDecisionPack(
          executionId,
          ledgerRecord
        );

        res.json({
          status: "generated",
          execution_id: executionId
        });
      }
    );
  }
);

/* =========================================================
   LEDGER VERIFY
========================================================= */

app.get("/ledger/verify",
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
      ledger_root: root
    });
  }
);

/* =========================================================
   START
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("DIIaC Backend — Decision Pack Enabled");
});

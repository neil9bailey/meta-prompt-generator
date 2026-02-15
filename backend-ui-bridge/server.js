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

const DERIVED_RUN_DIR =
  `${WORKSPACE}/artefacts/derived/run`;

const HUMAN_INPUT_DIR =
  `${WORKSPACE}/artefacts/human-input/inputs`;

const CTO_SCRIPT =
  `${WORKSPACE}/artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1`;

const EU_AI_ACT_SCRIPT =
  `${DERIVED_RUN_DIR}/generate-eu-ai-act-derived.ps1`;

/* =========================================================
   MIDDLEWARE
========================================================= */

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
   LEDGER VERIFY
========================================================= */

app.get("/ledger/verify",
  requireRole(["admin"]),
  (_, res) => {

    const lines = getLedgerLines();

    let previous = "GENESIS";

    for (let i = 0; i < lines.length; i++) {
      const record = JSON.parse(lines[i]);

      const recomputed = hash({
        ...record,
        record_hash: undefined
      });

      if (record.previous_hash !== previous ||
          record.record_hash !== recomputed) {
        return res.json({
          valid: false,
          records: lines.length,
          ledger_root: previous
        });
      }

      previous = record.record_hash;
    }

    res.json({
      valid: true,
      records: lines.length,
      ledger_root: previous
    });
  }
);

/* =========================================================
   FREEZE + NOTARISATION
========================================================= */

app.post("/ledger/freeze",
  requireRole(["admin"]),
  (_, res) => {

    const lines = getLedgerLines();
    const ledger_root =
      lines.length
        ? JSON.parse(lines[lines.length - 1]).record_hash
        : "GENESIS";

    const anchor = {
      version: "v0.5.0-b5-hardening",
      frozen: true,
      ledger_root,
      records: lines.length,
      freeze_timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      LEDGER_ANCHOR_PATH,
      JSON.stringify(anchor, null, 2)
    );

    if (!fs.existsSync(NOTARY_DIR))
      fs.mkdirSync(NOTARY_DIR, { recursive: true });

    const anchorHash = hash(anchor);

    fs.writeFileSync(
      `${NOTARY_DIR}/anchor.json`,
      JSON.stringify(
        { ...anchor, anchor_hash: anchorHash },
        null,
        2
      )
    );

    res.json({
      status: "frozen",
      ledger_root,
      anchor_hash: anchorHash
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

    execFile(
      "pwsh",
      [CTO_SCRIPT, "-Provider", provider],
      (err) => {

        if (err)
          return res.status(500).json({
            error: err.message
          });

        appendLedger({
          type: "GOVERNED_EXECUTION",
          provider,
          timestamp: new Date().toISOString()
        });

        res.json({ status: "executed", provider });
      }
    );
  }
);

/* =========================================================
   REPORTS
========================================================= */

app.get("/reports", (_, res) => {
  if (!fs.existsSync(GOVERNED_DIR))
    return res.json([]);

  res.json(fs.readdirSync(GOVERNED_DIR));
});

app.get("/reports/:file", (req, res) => {
  const filePath = path.join(
    GOVERNED_DIR,
    req.params.file
  );

  if (!fs.existsSync(filePath))
    return res.status(404).send("Not found");

  res.sendFile(filePath);
});

/* =========================================================
   DERIVED
========================================================= */

app.get("/derived", (_, res) => {
  if (!fs.existsSync(DERIVED_DIR))
    return res.json([]);

  res.json(
    fs.readdirSync(DERIVED_DIR)
      .filter(f => !f.endsWith(".ps1"))
  );
});

app.get("/derived/:file", (req, res) => {
  const filePath = path.join(
    DERIVED_DIR,
    req.params.file
  );

  if (!fs.existsSync(filePath))
    return res.status(404).send("Not found");

  res.sendFile(filePath);
});

/* =========================================================
   DERIVED — EU AI ACT GENERATION
========================================================= */

app.post("/derived/eu-ai-act",
  requireRole(["admin"]),
  (_, res) => {

    if (!fs.existsSync(EU_AI_ACT_SCRIPT)) {
      return res.status(500).json({
        error: "EU AI Act script not found"
      });
    }

    execFile(
      "pwsh",
      [EU_AI_ACT_SCRIPT],
      (err, stdout, stderr) => {

        if (err)
          return res.status(500).json({
            error: stderr || err.message
          });

        appendLedger({
          type: "DERIVED_GENERATION",
          category: "EU_AI_ACT",
          timestamp: new Date().toISOString()
        });

        res.json({ status: "generated" });
      }
    );
  }
);

/* =========================================================
   POLICY IMPACT
========================================================= */

app.post("/api/impact/policy",
  requireRole(["admin"]),
  (_, res) => {

    res.json({
      severity: "LOW",
      impacted_controls: 3,
      findings: 0,
      evaluated_at: new Date().toISOString()
    });
  }
);

/* =========================================================
   HUMAN INPUT
========================================================= */

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

    if (!fs.existsSync(HUMAN_INPUT_DIR))
      fs.mkdirSync(HUMAN_INPUT_DIR, { recursive: true });

    const id = Date.now().toString();

    const file =
      path.join(HUMAN_INPUT_DIR, `${id}.json`);

    fs.writeFileSync(
      file,
      JSON.stringify(req.body, null, 2)
    );

    res.json({ id });
  }
);

/* =========================================================
   START
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("DIIaC Backend — Production Stable");
});

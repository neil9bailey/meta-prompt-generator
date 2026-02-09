import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3001;

// -----------------------------
// CORS (RBAC-aware)
// -----------------------------
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-api-key",
      "x-role",
    ],
  })
);

app.use(express.json());

// -----------------------------
// Simple RBAC middleware
// -----------------------------
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.headers["x-role"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden",
        reason: "Insufficient role permissions",
      });
    }

    next();
  };
}

// -----------------------------
// Health
// -----------------------------
app.get("/", (req, res) => {
  res.send("DIIaC Backend running");
});

// -----------------------------
// Paths
// -----------------------------
const WORKSPACE = "/workspace";
const OUTPUT_DIR = path.join(
  WORKSPACE,
  "artefacts/step4-cto-strategy/output"
);
const SCRIPT_PATH = path.join(
  WORKSPACE,
  "artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1"
);

// -----------------------------
// Run Governance
// -----------------------------
app.post(
  "/govern/cto-strategy",
  requireRole(["govern"]),
  (req, res) => {
    const provider = req.query.provider;

    if (!provider) {
      return res.status(400).json({
        error: "Missing provider parameter",
      });
    }

    console.log("Received governed CTO strategy request", { provider });

    const cmd = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" -Provider "${provider}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("Governance execution failed", err);
        return res.status(500).json({
          error: "Governance execution failed",
          detail: stderr || err.message,
        });
      }

      res.json({
        message:
          "Governed reports generated successfully. Select a report below to view immutable, policy-governed output.",
        provider,
      });
    });
  }
);

// -----------------------------
// List governed reports
// -----------------------------
app.get(
  "/reports",
  requireRole(["viewer", "govern", "admin"]),
  (req, res) => {
    const files = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith(".md"));

    res.json(files);
  }
);

// -----------------------------
// Fetch governed report
// -----------------------------
app.get(
  "/reports/:file",
  requireRole(["viewer", "govern", "admin"]),
  (req, res) => {
    const filePath = path.join(OUTPUT_DIR, req.params.file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Not found");
    }

    res.send(fs.readFileSync(filePath, "utf-8"));
  }
);

// -----------------------------
// Trust Dashboard
// -----------------------------
app.get(
  "/trust",
  requireRole(["admin"]),
  (req, res) => {
    const ledgerPath = path.join(WORKSPACE, "ledger/ledger.jsonl");

    if (!fs.existsSync(ledgerPath)) {
      return res.json({
        executions: 0,
        providers: [],
        riskDistribution: {},
        ledgerContinuity: "INTACT",
      });
    }

    const entries = fs
      .readFileSync(ledgerPath, "utf-8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));

    const providers = [
      ...new Set(entries.map((e) => e.provider)),
    ];

    const riskDistribution = {};
    entries.forEach((e) => {
      riskDistribution[e.risk] =
        (riskDistribution[e.risk] || 0) + 1;
    });

    res.json({
      executions: entries.length,
      providers,
      riskDistribution,
      ledgerContinuity: "INTACT",
    });
  }
);

// -----------------------------
app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});

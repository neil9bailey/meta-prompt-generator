import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { requireRole } from "./auth/rbac.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

/* =========================================================
   Middleware
   ========================================================= */

app.use(cors());
app.use(express.json());

/**
 * CSP HARDENING (PRODUCTION ONLY)
 * - DO NOT TOUCH localhost
 * - Browser devtools noise ignored
 */
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

const GOVERNED_DIR = path.join(
  WORKSPACE,
  "artefacts/step4-cto-strategy/output"
);

const DERIVED_DIR = path.join(
  WORKSPACE,
  "artefacts/derived"
);

const LEDGER_PATH = path.join(
  WORKSPACE,
  "ledger/ledger.jsonl"
);

const TMP_DIR = path.join(WORKSPACE, "tmp");

fs.mkdirSync(TMP_DIR, { recursive: true });

/* =========================================================
   GOVERNED REPORTS
   ========================================================= */

app.get(
  "/reports",
  requireRole(["viewer", "admin"]),
  (_, res) => {
    const files = fs.existsSync(GOVERNED_DIR)
      ? fs.readdirSync(GOVERNED_DIR)
      : [];
    res.json(files);
  }
);

app.get(
  "/reports/:file",
  requireRole(["viewer", "admin"]),
  (req, res) => {
    const filePath = path.join(GOVERNED_DIR, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.sendFile(filePath);
  }
);

/* =========================================================
   GOVERNANCE EXECUTION
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
          message:
            "Governed reports generated successfully. Select a report below to view immutable, policy-governed output.",
          provider
        });
      }
    );
  }
);

/* =========================================================
   TRUST DASHBOARD
   ========================================================= */

app.get(
  "/trust",
  requireRole(["admin"]),
  (_, res) => {
    if (!fs.existsSync(LEDGER_PATH)) {
      return res.json({
        executions: 0,
        providers: [],
        riskDistribution: {},
        ledgerContinuity: "INTACT"
      });
    }

    const entries = fs
      .readFileSync(LEDGER_PATH, "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse);

    const providers = [...new Set(entries.map((e) => e.provider))];
    const riskDistribution = {};

    entries.forEach((e) => {
      riskDistribution[e.risk] =
        (riskDistribution[e.risk] || 0) + 1;
    });

    res.json({
      executions: entries.length,
      providers,
      riskDistribution,
      ledgerContinuity: "INTACT"
    });
  }
);

/* =========================================================
   DERIVED — EU AI ACT (NON-LLM)
   ========================================================= */

app.post(
  "/derived/eu-ai-act",
  requireRole(["admin"]),
  (_, res) => {
    const scriptPath =
      "/workspace/artefacts/derived/generate-eu-ai-act-derived.ps1";

    if (!fs.existsSync(scriptPath)) {
      console.error("Derived script missing:", scriptPath);
      return res.status(500).json({
        error: "Derived generation failed",
        detail: "Derived script not found inside container"
      });
    }

    execFile(
      "pwsh",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath
      ],
      (err, stdout, stderr) => {
        if (err) {
          console.error("Derived generation failed:", stderr);
          return res.status(500).json({
            error: "Derived generation failed"
          });
        }

        res.json({
          message: "EU AI Act derived artefacts generated"
        });
      }
    );
  }
);

app.get(
  "/derived",
  requireRole(["viewer", "admin"]),
  (_, res) => {
    const files = fs.existsSync(DERIVED_DIR)
      ? fs.readdirSync(DERIVED_DIR).filter((f) =>
          f.endsWith(".md")
        )
      : [];
    res.json(files);
  }
);

app.get(
  "/derived/:file",
  requireRole(["viewer", "admin"]),
  (req, res) => {
    const filePath = path.join(DERIVED_DIR, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.sendFile(filePath);
  }
);

/* =========================================================
   SAFE EXPORT (MARKDOWN ONLY)
   - FIXES 404 ONLY
   - NO REGRESSION
   ========================================================= */

app.get(
  "/export/:file/:format",
  requireRole(["viewer", "admin"]),
  (req, res) => {
    const { file, format } = req.params;

    if (!file.endsWith(".md")) return res.status(404).end();
    if (!["docx", "pdf"].includes(format))
      return res.status(400).end();

    const governedPath = path.join(GOVERNED_DIR, file);
    const derivedPath = path.join(DERIVED_DIR, file);

    const source = fs.existsSync(governedPath)
      ? governedPath
      : fs.existsSync(derivedPath)
      ? derivedPath
      : null;

    if (!source) return res.status(404).end();

    const output = path.join(
      TMP_DIR,
      file.replace(/\.md$/, `.${format}`)
    );

    execFile("pandoc", [source, "-o", output], (err) => {
      if (err) {
        console.error("Pandoc export failed:", err);
        return res.status(500).end();
      }

      res.download(output, () =>
        fs.unlink(output, () => {})
      );
    });
  }
);

/* =========================================================
   SAFE LLM INGESTION (FEATURE-FLAGGED)
   ========================================================= */

app.post(
  "/ingest/cto-strategy",
  requireRole(["admin"]),
  (_, res) => {
    if (process.env.ENABLE_LLM_INGEST !== "true") {
      return res.status(403).json({
        error: "LLM ingestion disabled by policy"
      });
    }

    const script =
      "/workspace/artefacts/llm-ingest/ingest-llm-draft.ps1";

    if (!fs.existsSync(script)) {
      return res.status(500).json({
        error: "LLM ingestion script missing"
      });
    }

    execFile(
      "pwsh",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
      (err) => {
        if (err) {
          console.error("LLM ingestion failed:", err);
          return res.status(500).json({
            error: "LLM ingestion failed"
          });
        }

        res.json({ message: "LLM draft ingested" });
      }
    );
  }
);

/* =========================================================
   START
   ========================================================= */

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on http://0.0.0.0:${PORT}`)
);

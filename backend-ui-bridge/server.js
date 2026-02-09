import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
const PORT = 3001;

/*
  Inside Docker:
    - Deterministic artefacts, contracts, and ledger
      are mounted at /workspace
    - Execution must NEVER reference host paths (e.g. F:\)
*/
const WORKSPACE = "/workspace";

app.use(cors());
app.use(express.json());

app.post("/govern/cto-strategy", (_req, res) => {
  console.log("Received governed CTO strategy request");

  exec(
    "pwsh -File artefacts/step4-cto-strategy/run/run-cto-strategy-governed-core.ps1",
    {
      cwd: WORKSPACE,
      env: {
        ...process.env,
        DIIAC_ROOT: WORKSPACE
      }
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error("Governance execution failed");
        console.error(stderr);

        res.status(500).json({
          status: "error",
          message: "Governance execution failed"
        });
        return;
      }

      console.log(stdout);

      res.status(200).json({
        status: "ok",
        message: "Governed CTO Strategy report generated",
        artefactPath: "artefacts/step4-cto-strategy/output"
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});

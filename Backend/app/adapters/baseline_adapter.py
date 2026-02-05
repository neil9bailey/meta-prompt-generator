from app.adapters.base import BaseAdapter
from app.execution.contracts.execution_result import ExecutionResult
from app.execution.ledger.ledger_store import ledger_store


class BaselineAdapter(BaseAdapter):
    """
    Baseline adapter (v1.3.0 MVP).

    Purpose:
    - Seed the execution ledger with a known contract record
    - Explicitly NOT a validated or risk-assessed execution
    - Used for bootstrap, demo, and baseline population only

    Invariant:
    - All records written by this adapter are marked as execution_type="baseline"
    """

    name = "baseline"

    def execute(self, request, ctx):
        # Write a baseline (non-validated, non-risk-assessed) record to the ledger
        ledger_store.write(
            request.contract_id,
            {
                "contract_id": request.contract_id,
                "execution_id": request.execution_id,
                "payload": request.payload,
                "adapter": self.name,
                "execution_type": "baseline",
            },
        )

        # Return a minimal execution confirmation
        return ExecutionResult(
            status="ok",
            data={
                "contract_id": request.contract_id,
                "written": True,
                "adapter": self.name,
                "execution_type": "baseline",
            },
        )

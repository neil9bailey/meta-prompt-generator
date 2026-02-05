from app.execution.ledger.ledger_store import ledger_store


class ExecutionRouter:
    """
    Canonical execution router (v1.3.0).
    Routes execution requests to registered adapters and persists results.
    """

    def __init__(self, registry):
        self.registry = registry

    def execute(self, adapter_name, request):
        # Prevent duplicate contract execution
        if ledger_store.exists(request.contract_id):
            return {
                "status": "conflict",
                "message": "Contract already exists in ledger",
            }

        # 🔧 FIX: registry API is `.get()`
        adapter = self.registry.get(adapter_name)

        ctx = {
            "execution_id": request.execution_id,
            "contract_id": request.contract_id,
        }

        result = adapter.execute(request, ctx)

        return result

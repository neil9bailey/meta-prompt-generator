from typing import Dict, Any


class ExecutionLedgerStore:
    """
    Canonical in-memory execution ledger (v1.3.0).
    This is the SINGLE source of truth for execution state.
    """

    def __init__(self):
        self._records: Dict[str, Dict[str, Any]] = {}

    def exists(self, contract_id: str) -> bool:
        return contract_id in self._records

    def write(self, contract_id: str, record: Dict[str, Any]) -> None:
        self._records[contract_id] = record

    def read(self, contract_id: str) -> Dict[str, Any] | None:
        return self._records.get(contract_id)

    def all(self) -> Dict[str, Dict[str, Any]]:
        return self._records


# 🔒 GLOBAL SINGLETON — DO NOT REINSTANTIATE ANYWHERE
ledger_store = ExecutionLedgerStore()

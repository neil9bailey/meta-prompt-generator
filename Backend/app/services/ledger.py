import json
import os
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, List

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LEDGER_DIR = os.path.join(BASE_DIR, "ledger")
LEDGER_FILE = os.path.join(LEDGER_DIR, "decision_ledger.jsonl")

ENGINE_VERSION = "v1.3.0-mvp"

os.makedirs(LEDGER_DIR, exist_ok=True)


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _canonical_json(obj: Dict[str, Any]) -> bytes:
    """
    Deterministic JSON serialisation for hashing.
    """
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def _get_last_hash() -> Optional[str]:
    if not os.path.exists(LEDGER_FILE):
        return None

    with open(LEDGER_FILE, "rb") as f:
        try:
            f.seek(-2, os.SEEK_END)
            while f.read(1) != b"\n":
                f.seek(-2, os.SEEK_CUR)
        except OSError:
            f.seek(0)

        line = f.readline()
        if not line:
            return None

        record = json.loads(line.decode("utf-8"))
        return record.get("entry_hash")


def contract_exists(contract_id: str) -> bool:
    if not os.path.exists(LEDGER_FILE):
        return False

    with open(LEDGER_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            if record.get("contract_id") == contract_id:
                return True

    return False


def get_contract_record(contract_id: str) -> Optional[Dict[str, Any]]:
    """
    Read-only lookup of a specific ledger entry by contract_id.
    Used for report generation only.
    """
    if not os.path.exists(LEDGER_FILE):
        return None

    with open(LEDGER_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            if record.get("contract_id") == contract_id:
                return record

    return None


def append_ledger(
    contract_id: str,
    output: Dict[str, Any],
    validation: Dict[str, Any],
    risk_assessment: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prev_hash = _get_last_hash()

    record_core = {
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "engine_version": ENGINE_VERSION,
        "contract_id": contract_id,
        "previous_hash": prev_hash,
        "output": output,
        "validation": validation,
        "risk_assessment": risk_assessment,
    }

    entry_hash = _sha256(_canonical_json(record_core))
    record = {**record_core, "entry_hash": entry_hash}

    with open(LEDGER_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return record


def read_ledger(limit: int = 10) -> List[Dict[str, Any]]:
    if not os.path.exists(LEDGER_FILE):
        return []

    records: List[Dict[str, Any]] = []

    with open(LEDGER_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))

    return records[-limit:]


def verify_ledger() -> Dict[str, Any]:
    if not os.path.exists(LEDGER_FILE):
        return {"status": "empty", "valid": True}

    prev_hash = None
    index = 0

    with open(LEDGER_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            index += 1
            record = json.loads(line)

            if record.get("previous_hash") != prev_hash:
                return {
                    "status": "invalid",
                    "valid": False,
                    "at_index": index,
                    "reason": "previous_hash mismatch",
                }

            core = {
                "timestamp_utc": record["timestamp_utc"],
                "engine_version": record["engine_version"],
                "contract_id": record["contract_id"],
                "previous_hash": record["previous_hash"],
                "output": record["output"],
                "validation": record["validation"],
                "risk_assessment": record.get("risk_assessment"),
            }

            computed = _sha256(_canonical_json(core))
            if computed != record.get("entry_hash"):
                return {
                    "status": "invalid",
                    "valid": False,
                    "at_index": index,
                    "reason": "entry_hash mismatch",
                }

            prev_hash = record["entry_hash"]

    return {"status": "valid", "valid": True, "entries": index}

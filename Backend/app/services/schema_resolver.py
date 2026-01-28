import json
from pathlib import Path
from typing import Dict, Any

from app.exceptions import SchemaNotFoundError

BASE_DIR = Path(__file__).resolve().parents[1]
SCHEMA_DIR = BASE_DIR / "library" / "schemas"


def list_schemas() -> list[str]:
    return sorted(p.stem for p in SCHEMA_DIR.glob("*.json"))


def load_schema(name: str) -> Dict[str, Any]:
    path = SCHEMA_DIR / f"{name}.json"
    if not path.exists():
        raise SchemaNotFoundError(f"Schema not found: {name}")

    data = json.loads(path.read_text(encoding="utf-8"))

    if "extends" in data:
        parent = load_schema(data["extends"])
        merged = {**parent, **data.get("fields", {})}
        return merged

    return data

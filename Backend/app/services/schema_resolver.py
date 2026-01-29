import json
from pathlib import Path
from typing import Any, Set

from app.exceptions import SchemaNotFoundError, LibraryFileError

BASE_DIR = Path(__file__).resolve().parents[1]
SCHEMA_DIR = BASE_DIR / "library" / "schemas"


def _load_schema_file(path: Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        raise LibraryFileError(f"Schema file empty: {path.name}")

    try:
        return json.loads(raw)
    except Exception as exc:
        raise LibraryFileError(f"Invalid JSON in schema {path.name}") from exc


def load_schema(name: str, _seen: Set[str] | None = None) -> dict[str, Any]:
    if _seen is None:
        _seen = set()

    if name in _seen:
        raise LibraryFileError(f"Schema inheritance cycle detected at {name}")

    _seen.add(name)

    path = SCHEMA_DIR / f"{name}.json"
    if not path.exists():
        raise SchemaNotFoundError(f"Schema not found: {name}")

    schema = _load_schema_file(path)

    parent = schema.get("extends")
    if parent:
        parent_schema = load_schema(parent, _seen)
        merged = parent_schema | schema
        merged.pop("extends", None)
        return merged

    return schema

import json
import re
from pathlib import Path
from typing import Any, Set

from app.exceptions import SchemaNotFoundError, LibraryFileError, InvalidSchemaNameError

BASE_DIR = Path(__file__).resolve().parents[1]
SCHEMA_DIR = BASE_DIR / "library" / "schemas"

SCHEMA_NAME_PATTERN = re.compile(r"^[A-Z0-9_]+$")
MAX_INHERITANCE_DEPTH = 3


def _validate_schema_name(name: str) -> None:
    if not SCHEMA_NAME_PATTERN.match(name):
        raise InvalidSchemaNameError(f"Invalid schema name: {name}")


def _load_schema_file(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SchemaNotFoundError(f"Schema not found: {path.stem}")

    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        raise LibraryFileError(f"Schema file empty: {path.name}")

    try:
        return json.loads(raw)
    except Exception as exc:
        raise LibraryFileError(f"Invalid JSON in schema {path.name}") from exc


def _merge_parent_child(parent: dict[str, Any], child: dict[str, Any]) -> dict[str, Any]:
    """
    v1 rule: shallow merge only.
    Child overrides parent at top level.
    """
    merged = dict(parent)
    merged.update(child)
    merged.pop("extends", None)
    return merged


def load_schema(
    name: str,
    *,
    _visited: Set[str] | None = None,
    _depth: int = 0,
) -> dict[str, Any]:
    _validate_schema_name(name)

    if _visited is None:
        _visited = set()

    if name in _visited:
        raise LibraryFileError(f"Schema inheritance cycle detected at '{name}'")

    if _depth > MAX_INHERITANCE_DEPTH:
        raise LibraryFileError(
            f"Schema inheritance exceeds max depth ({MAX_INHERITANCE_DEPTH})"
        )

    _visited.add(name)

    path = SCHEMA_DIR / f"{name}.json"
    schema = _load_schema_file(path)

    parent_name = schema.get("extends")
    if parent_name:
        _validate_schema_name(parent_name)
        parent_schema = load_schema(
            parent_name,
            _visited=_visited,
            _depth=_depth + 1,
        )
        return _merge_parent_child(parent_schema, schema)

    return schema


def list_schemas() -> list[str]:
    if not SCHEMA_DIR.exists():
        return []

    return sorted(
        p.stem
        for p in SCHEMA_DIR.glob("*.json")
        if SCHEMA_NAME_PATTERN.match(p.stem)
    )

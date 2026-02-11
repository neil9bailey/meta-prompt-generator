import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
LIBRARY_DIR = BASE_DIR / "library"


def validate_library(return_errors: bool = False) -> tuple[bool, list[str]]:
    errors: list[str] = []

    for file in LIBRARY_DIR.rglob("*.json"):
        try:
            raw = file.read_text(encoding="utf-8").strip()
            if not raw:
                raise ValueError("File is empty")
            json.loads(raw)
        except Exception as exc:
            errors.append(f"{file.relative_to(LIBRARY_DIR)} → {exc}")

    ok = len(errors) == 0
    return ok, errors


def validate_library_or_exit() -> None:
    ok, errors = validate_library()
    if not ok:
        print("\n❌ INVALID LIBRARY CONTENT\n")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("✅ Library validation passed")


if __name__ == "__main__":
    validate_library_or_exit()

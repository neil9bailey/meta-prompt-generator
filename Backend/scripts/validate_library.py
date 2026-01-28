import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1] / "app" / "library"

FAILURES = []


def validate_json(path: Path) -> None:
    try:
        text = path.read_text(encoding="utf-8").strip()
        if not text:
            raise ValueError("File is empty")
        json.loads(text)
    except Exception as exc:
        FAILURES.append(f"{path.relative_to(BASE_DIR)} → {exc}")


def main() -> None:
    for json_file in BASE_DIR.rglob("*.json"):
        validate_json(json_file)

    if FAILURES:
        print("\n❌ INVALID LIBRARY CONTENT\n")
        for f in FAILURES:
            print(" -", f)
        sys.exit(1)

    print("✅ Library content validation passed")


if __name__ == "__main__":
    main()

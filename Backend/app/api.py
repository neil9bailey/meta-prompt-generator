from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import json
import os

app = FastAPI(title="Meta Prompt Generator v1.0.0")

# ----------------------------
# CORS (REQUIRED FOR FRONTEND)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3100"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Library paths
# ----------------------------
BASE_DIR = os.path.dirname(__file__)
LIBRARY_DIR = os.path.join(BASE_DIR, "library")

ROLES_DIR = os.path.join(LIBRARY_DIR, "roles")
SCHEMAS_DIR = os.path.join(LIBRARY_DIR, "schemas")
MODULES_DIR = os.path.join(LIBRARY_DIR, "modules")
OVERLAYS_DIR = os.path.join(LIBRARY_DIR, "overlays")

# ----------------------------
# Helpers
# ----------------------------
def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_json_dir(path: str) -> Dict[str, Dict[str, Any]]:
    results = {}
    for fname in sorted(os.listdir(path)):
        if fname.endswith(".json"):
            key = fname.replace(".json", "")
            results[key] = load_json(os.path.join(path, fname))
    return results


# ----------------------------
# Preload library
# ----------------------------
ROLES = load_json_dir(ROLES_DIR)
SCHEMAS = load_json_dir(SCHEMAS_DIR)
MODULES = load_json_dir(MODULES_DIR)

# ----------------------------
# API: discovery
# ----------------------------
@app.get("/api/roles")
def api_roles():
    return [{"id": k, **v} for k, v in ROLES.items()]


@app.get("/api/schemas")
def api_schemas():
    return [{"id": k, **v} for k, v in SCHEMAS.items()]


# ----------------------------
# Generate
# ----------------------------
class GenerateRequest(BaseModel):
    role: str
    schema_id: str
    intent: str
    input: Dict[str, Any] = {}


@app.post("/api/generate")
def api_generate(req: GenerateRequest):
    if req.role not in ROLES:
        raise ValueError(f"Unknown role: {req.role}")

    if req.schema_id not in SCHEMAS:
        raise ValueError(f"Unknown schema: {req.schema_id}")

    role_def = ROLES[req.role]
    schema_def = SCHEMAS[req.schema_id]

    module_order = [
        "first_principles",
        "constraints_first",
        "devils_advocate",
        "deep_research",
    ]

    module_blocks = []
    for m in module_order:
        if m in MODULES:
            module_blocks.append(MODULES[m].get("prompt", ""))

    assembled_prompt = f"""
You are acting as a {role_def.get("title", req.role)}.

ROLE CONTEXT:
{role_def.get("description", "")}

DECISION HORIZON:
Think in 3–5 year strategic horizons. Optimise for executive-level clarity,
risk-aware decision making, and long-term architectural soundness.

SCHEMA:
{schema_def.get("description", "")}

OUTPUT STRUCTURE:
{schema_def.get("structure", "")}

REASONING MODES:
{"".join(module_blocks)}

USER INTENT:
{req.intent}

ADDITIONAL INPUT:
{json.dumps(req.input, indent=2)}

INSTRUCTIONS:
- Write in clear executive language
- Be opinionated but evidence-led
- Compare vendors explicitly where relevant
- Avoid generic filler
- Produce a board-ready response
""".strip()

    return {"prompt": assembled_prompt}

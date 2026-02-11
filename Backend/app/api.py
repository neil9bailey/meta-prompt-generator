from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.services.assembler import assemble_prompt
from app.services.roles import list_roles
from app.services.schema_resolver import list_schemas
from app.services.versioning import store_prompt
from app.exceptions import MetaPromptError

router = APIRouter()


# -----------------------------
# Request Models
# -----------------------------

class GenerateRequest(BaseModel):
    role: str
    task: str
    schema_name: str = Field(..., alias="schema")
    vendors: list[str] | None = None
    security: list[str] | None = None

    class Config:
        populate_by_name = True


# -----------------------------
# Read APIs
# -----------------------------

@router.get("/roles", response_model=list[str])
def get_roles() -> list[str]:
    return list_roles()


@router.get("/schemas", response_model=list[str])
def get_schemas() -> list[str]:
    return list_schemas()


# -----------------------------
# Generate API
# -----------------------------

@router.post("/generate", response_model=dict[str, str])
def generate_prompt(req: GenerateRequest) -> dict[str, str]:
    try:
        prompt = assemble_prompt(
            role=req.role,
            task=req.task,
            schema_name=req.schema_name,
            vendors=req.vendors,
            security=req.security,
        )
        record = store_prompt({
            "role": req.role,
            "task": req.task,
            "schema": req.schema_name,
            "prompt": prompt,
        })
        return {"prompt": prompt, "id": record["id"]}

    except MetaPromptError as exc:
        # All domain errors → clean 400s
        return JSONResponse(
            status_code=400,
            content={"error": exc.__class__.__name__, "message": str(exc)},
        )

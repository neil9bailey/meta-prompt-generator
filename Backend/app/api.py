from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.services.assembler import assemble_prompt
from app.services.roles import list_roles
from app.services.schema_resolver import list_schemas
from app.exceptions import MetaPromptError

router = APIRouter()


# -----------------------------
# Request Models
# -----------------------------

class GenerateRequest(BaseModel):
    role: str
    task: str
    schema_name: str = Field(..., alias="schema")

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
        )
        return {"prompt": prompt}

    except MetaPromptError as exc:
        # All domain errors → clean 400s
        return JSONResponse(
            status_code=400,
            content={"error": exc.__class__.__name__, "message": str(exc)},
        )

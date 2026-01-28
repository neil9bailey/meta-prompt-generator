from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.assembler import assemble_prompt
from app.services.roles import list_roles
from app.services.schema_resolver import list_schemas
from app.exceptions import MetaPromptError

router = APIRouter()


class GenerateRequest(BaseModel):
    role: str
    task: str
    schema: str


@router.get("/roles")
def get_roles() -> list[str]:
    return list_roles()


@router.get("/schemas")
def get_schemas() -> list[str]:
    return list_schemas()


@router.post("/generate")
def generate_prompt(req: GenerateRequest) -> dict[str, str]:
    try:
        prompt = assemble_prompt(
            role=req.role,
            task=req.task,
            schema_name=req.schema,
        )
        return {"prompt": prompt}
    except MetaPromptError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

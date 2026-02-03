from pydantic import BaseModel, Field
from typing import Any, Dict, List


class GenerateRequest(BaseModel):
    role: str
    schema_id: str
    intent: str
    additional_input: Dict[str, Any] = Field(default_factory=dict)
    instructions: List[str] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    prompt: str

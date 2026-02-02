from dataclasses import dataclass
from typing import Any, Optional, Dict

@dataclass(frozen=True)
class ExecutionRequest:
    role: str
    schema: str
    intent: str
    input: Any
    assembled_prompt: str
    constraints: Optional[Dict[str, Any]] = None

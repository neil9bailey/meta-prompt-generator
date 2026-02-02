from app.execution.contracts import ExecutionRequest


def normalize_execution_request(
    *,
    role: str,
    schema: str,
    intent: str,
    input_data,
    assembled_prompt: str,
    constraints=None,
) -> ExecutionRequest:
    """
    Normalize internal execution inputs into a deterministic,
    adapter-facing ExecutionRequest.

    This is the ONLY place where adapter input is shaped.
    """
    return ExecutionRequest(
        role=role,
        schema=schema,
        intent=intent,
        input=input_data,
        assembled_prompt=assembled_prompt,
        constraints=constraints,
    )

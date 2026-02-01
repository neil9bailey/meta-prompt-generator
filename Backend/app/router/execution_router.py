from typing import Dict, Any

from app.adapters.registry import ADAPTER_REGISTRY


class ExecutionRouter:
    """
    Routes execution requests to the correct adapter and
    enforces a strict adapter response contract.
    """

    def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        # 🔒 Canonical internal field names
        schema = request["schema"]
        role = request["role"]

        adapter = self._select_adapter(schema, role)
        if not adapter:
            return {
                "error": "NO_ADAPTER_AVAILABLE",
                "detail": f"No adapter supports schema={schema}, role={role}",
            }

        adapter_result = adapter.execute(
            {
                "schema": schema,
                "role": role,
                "intent": request["intent"],
                "input": request.get("input", {}),
                "options": request.get("options", {}),
            }
        )

        if "result" not in adapter_result:
            return {
                "error": "INVALID_ADAPTER_RESPONSE",
                "detail": adapter_result,
            }

        return {
            "adapter": adapter.name,
            "schema": schema,
            "role": role,
            "result": adapter_result.get("result"),
            "metadata": adapter_result.get("metadata", {}),
        }

    def _select_adapter(self, schema: str, role: str):
        for adapter in ADAPTER_REGISTRY:
            caps = adapter.capabilities
            if schema in caps.get("schemas", []) and role in caps.get("roles", []):
                return adapter
        return None

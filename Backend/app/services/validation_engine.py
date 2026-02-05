from typing import Dict, Any, List
from app.services.policy_config import get_policy

def validate_output(output: Dict[str, Any]) -> Dict[str, Any]:
    policy = get_policy()

    required_fields = set(policy["required_fields"])
    min_len = policy.get("min_field_length", 0)

    if not isinstance(output, dict):
        return {
            "policy_gate": "fail",
            "reason": "Output is not a JSON object",
            **policy_metadata(policy),
        }

    missing: List[str] = sorted(required_fields - output.keys())
    if missing:
        return {
            "policy_gate": "fail",
            "missing_fields": missing,
            **policy_metadata(policy),
        }

    too_short = [
        k for k in required_fields
        if isinstance(output.get(k), str) and len(output[k].strip()) < min_len
    ]

    if too_short:
        return {
            "policy_gate": "fail",
            "insufficient_detail": too_short,
            **policy_metadata(policy),
        }

    return {
        "policy_gate": "pass",
        **policy_metadata(policy),
    }

def policy_metadata(policy: Dict[str, Any]) -> Dict[str, str]:
    return {
        "policy_id": policy["policy_id"],
        "policy_version": policy["policy_version"],
        "policy_hash": policy["policy_hash"],
    }

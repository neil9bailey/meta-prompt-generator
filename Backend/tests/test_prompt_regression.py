from pathlib import Path
from app.services.assembler import assemble_prompt


def test_ea_solution_prompt_golden():
    prompt = assemble_prompt(
        role="Enterprise Architect",
        task="Design a target state architecture",
        schema_name="EA_SOLUTION",
    ).strip()

    golden = (
        Path(__file__)
        .parent
        / "golden"
        / "ea_solution.prompt.txt"
    ).read_text(encoding="utf-8").strip()

    assert prompt == golden

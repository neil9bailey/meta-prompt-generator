from app.services.assembler import assemble_prompt


def test_prompt_contains_all_sections():
    prompt = assemble_prompt(
        role="Enterprise Architect",
        task="Design a target state architecture",
        schema_name="EA_SOLUTION",
    )

    assert "ACT AS:" in prompt
    assert "TASK:" in prompt
    assert "OUTPUT FORMAT:" in prompt
    assert "first_principles" not in prompt.lower()  # content, not filenames


def test_list_content_modules_are_supported():
    prompt = assemble_prompt(
        role="Enterprise Architect",
        task="Validate list content handling",
        schema_name="EA_SOLUTION",
    )

    assert isinstance(prompt, str)
    assert len(prompt) > 100

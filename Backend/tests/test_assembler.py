import pytest
from app.services.assembler import assemble_prompt
from app.errors import RoleNotFoundError, InvalidSchemaNameError


def test_missing_role_raises_error():
    with pytest.raises(RoleNotFoundError):
        assemble_prompt("NonExistentRole", "Test task", "TEST_SCHEMA")


def test_invalid_schema_name():
    with pytest.raises(InvalidSchemaNameError):
        assemble_prompt("Enterprise Architect", "Test task", "bad-schema")


def test_valid_prompt_generation():
    result = assemble_prompt(
        "Enterprise Architect",
        "Design a target state architecture",
        "EA_SOLUTION"
    )
    assert "ACT AS:" in result
    assert "FORMAT AS: EA_SOLUTION" in result


def test_corrupt_role_json_raises_error(tmp_path, monkeypatch):
    from app.services import assembler

    bad_role = tmp_path / "roles"
    bad_role.mkdir()
    bad_file = bad_role / "enterprise_architect.json"
    bad_file.write_text("")

    monkeypatch.setattr(assembler, "ROLES_DIR", tmp_path / "roles")
    monkeypatch.setattr(assembler, "MODULES_DIR", tmp_path / "modules")
    monkeypatch.setattr(assembler, "SCHEMA_DIR", tmp_path / "schemas")


    with pytest.raises(ValueError):
        assembler.assemble_prompt(
            "Enterprise Architect",
            "Test task",
            "EA_SOLUTION"
        )


def test_missing_module_file_raises_error(tmp_path, monkeypatch):
    from app.services import assembler

    # Create minimal role
    roles = tmp_path / "roles"
    modules = tmp_path / "modules"
    roles.mkdir()
    modules.mkdir()

    (roles / "enterprise_architect.json").write_text(
        '{"role":"Enterprise Architect","mission":"x","decision_style":"x","communication_style":"x"}'
    )

    monkeypatch.setattr(assembler, "BASE", tmp_path)

    with pytest.raises(FileNotFoundError):
        assembler.assemble_prompt(
            "Enterprise Architect",
            "Test task",
            "EA_SOLUTION"
        )

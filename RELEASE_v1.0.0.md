# Meta Prompt Generator — v1.0.0 Release Checklist

## 🔒 Stability Gates (Must Pass)

- [ ] `python Backend/scripts/validate_library.py` passes
- [ ] All JSON files are non-empty and valid
- [ ] `docker compose up --build` completes cleanly
- [ ] `/roles` returns expected roles
- [ ] `/schemas` returns expected schemas
- [ ] `/generate` works for EA_SOLUTION
- [ ] Golden prompt tests pass
- [ ] No 500 errors in logs during generate

## 🧪 Test Integrity

- [ ] `pytest` passes with 0 skips
- [ ] Golden prompt test unchanged
- [ ] No schema name regex violations

## 🧱 Architectural Constraints (v1)

- ❌ No dynamic overlays
- ❌ No runtime prompt mutation
- ❌ No frontend schema logic
- ✅ Backend is single source of truth

## 🚀 Release

- [ ] Tag: `v1.0.0`
- [ ] Changelog written
- [ ] Docker images rebuilt
- [ ] CI green

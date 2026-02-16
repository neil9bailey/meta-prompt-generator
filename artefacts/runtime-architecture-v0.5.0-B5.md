\# DIIaC™ Runtime Architecture Declaration

Version: v0.5.0-B5

Classification: Governance Record



---



This document formally declares the operational runtime

architecture of the DIIaC system as deployed.



---



\## Runtime Authority



Backend:

Node (Express)



Container:

diiac-backend



Port:

3001



Frontend:

Vite (5173)



There is no Python runtime backend in production.



---



\## Ledger Authority



Ledger path:

workspace/ledger/ledger.jsonl



Hash model:

record\_hash (SHA-256)



Chain model:

previous\_hash → record\_hash



Freeze anchor:

workspace/ledger/ledger.anchor.json



Ledger is append-only.



---



\## Decision Pack Model



Location:

workspace/artefacts/decision-packs/{execution\_id}



Contents:

• decision.json

• ledger\_snapshot.json

• artefacts\_index.json



Decision packs are additive artefacts.

They do not alter ledger behaviour.



---



\## Governance Integrity



The following remain true:



• Freeze prevents append

• Verify returns deterministic root

• Hash algorithm unchanged

• No dual backend runtime

• No implicit execution

• RBAC enforced



---



This declaration aligns with:

Tag: v0.5.0-B5-hardening-stable



Authoritative.


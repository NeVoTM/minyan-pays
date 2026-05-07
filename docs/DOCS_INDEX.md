# MinyanPays Docs Index (Canonical Map)

*Last updated: 2026-05-06*

This file keeps the docs set lean by defining what is canonical vs reference.

## Canonical docs (active)

- `docs/PROGRAMMER_HANDOFF.md` — architecture, auth, API map, debugging history.
- `PROJECT_STATUS.md` — what changed most recently, blockers, next actions.
- `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` — scope lock + backlog priorities (Tasks 3+ now).
- `docs/AI_VERIFICATION_CHECKLIST.md` — canonical "ask another AI to review/test" checklist.
- `docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md` — platform-specific usage notes (Copilot/Gemini access and workflow), intentionally shorter than the checklist.
- `docs/SECURITY_ROUTE_AUDIT.md` — route protection + cross-tenant audit artifact.

## Keep separate (do NOT merge right now)

- `PROGRAMMER_HANDOFF` vs `PROJECT_STATUS`: one is stable reference, one is rolling session log.
- `AI_VERIFICATION_CHECKLIST` vs `COPILOT_GEMINI_REVIEW_INSTRUCTIONS`: one is review template/output contract, one is tool/platform setup.
- `SECURITY_ROUTE_AUDIT`: formal sign-off artifact; should stay standalone.

## De-duplication policy

- If the same rule appears in multiple docs, keep full detail in one canonical file and replace duplicates with a one-line pointer.
- Avoid "answer templates" tied to one chat in canonical docs.
- During daily testing mode, review and trim duplicates before closing the day.

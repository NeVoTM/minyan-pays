# Project Status – Where We Left Off

*Last updated: 2026-05-04*

## Current Task / Goal

**Completion directive** (`MINYANPAYS_COMPLETION_DIRECTIVE`): ship MinyanPays only — deployment fix, secure auth, three tefillos, first-nine UX, Zelle export, member balance wallet UI, rabbi/admin polish, kiosk, demo seed, i18n. **In progress:** Tasks 1–2 landed in code; Tasks 3+ not started in this pass.

## What's Done

- **Task 1 (deploy / blank page):** `OrgContext` no longer treats HTML (same-origin `/api` fallback) as JSON; detects missing **`VITE_API_BASE_URL`** in production builds and shows an amber **deploy banner** (`deployMissingApiBase` / `deployBadResponse`). **`apiBase.ts`** documents correct API host example. **`render.yaml`** comments clarify **`apps/web/dist`** publish path and add **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** to API env template.
- **Task 2 (auth):** **`POST /api/auth/admin`** requires **`ADMIN_PASSWORD`** (timing-safe string compare). **`POST /api/auth/rabbi`** checks **`Organization.rabbiPasswordHash`** else **`RABBI_PASSWORD`**. **`POST /api/auth/member`** requires **`pin`** and **`bcrypt.compare`** vs **`User.pinHash`**. JWT **`expiresIn`** set to **`24h`** for admin, rabbi, and member (`middleware/auth.ts`). **`apps/api/.env.example`** lists **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`**, **`WEB_ORIGIN`**, **`PORT`**. **`timingSafeString.ts`** added.
- **Web login UI:** **`AdminLogin`** password field; **`RabbiLogin`** password field; **`MemberLogin`** PIN field and payload. English strings + **`rabbiLogin.passwordRequired`**. **`OrgProvider`** clears **`minyan_rabbi_token`** on org change.
- **`docs/PROGRAMMER_HANDOFF.md`:** Security section updated to reflect restored credential checks (date line remains **2026-05-03** per doc convention).

## What's Next / Blockers

- **Render dashboard (manual):** Set **`VITE_API_BASE_URL`** on the static service to the live API origin (e.g. `https://minyan-pays.onrender.com`), set **`ADMIN_PASSWORD`** / **`RABBI_PASSWORD`** on the API service, **redeploy both** so the browser bundle embeds the API URL and logins work.
- **Local dev:** Copy **`apps/api/.env.example`** → **`.env`** and set **`ADMIN_PASSWORD`** (and rabbi fallback if needed) before admin/rabbi login.
- **Directive remainder:** Task 3 (TefillahType + UI), 4–11 per **`MINYANPAYS_COMPLETION_DIRECTIVE`** — design-system components, weekly export columns, treasury budget check, kiosk route, demo seed, full i18n for new strings.
- **Cross-tenant audit:** Confirm every protected route enforces org id + role vs JWT (directive §2).

## Notes / Context

- **Reviewer report:** Full sprint summary for double-checking (done vs remaining vs ops) — **`docs/CLAUDE_REVIEW_REPORT.md`**.
- **Claude Code:** CLI installed globally; launch + **`claude auth login`** — **`docs/CLAUDE_CODE_SETUP.md`**. Root context — **`CLAUDE.md`**. First-run summary (same intent as interactive prompts; use if CLI not authenticated) — **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`**.
- Health check returns **`{ ok: true, service: "minyan-pays-api" }`** (not `{ status: "ok" }`).
- **`lucide-react`** is not in **`apps/web/package.json`** yet — Task 8 / design system will add it.

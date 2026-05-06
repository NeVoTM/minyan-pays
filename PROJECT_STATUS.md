# Project Status – Where We Left Off

*Last updated: 2026-05-06*

## Current Task / Goal

**Completion directive** (`MINYANPAYS_COMPLETION_DIRECTIVE`): ship MinyanPays only — deployment fix, secure auth, three tefillos, first-nine UX, Zelle export, member balance wallet UI, rabbi/admin polish, kiosk, demo seed, i18n. **In progress:** Tasks 1–2 landed in code; Tasks 3+ not started in this pass.

## What's Done

- **Local “could not load locations” fix:** Root cause was API failing on DB (`127.0.0.1:5433`) when embedded Postgres was not running, or **`npm run db:local`** failing because **`scripts/embedded-pg-serve.mjs`** always called **`initialise()`** on a non-empty **`.embedded-pg`** directory. Script now skips **`initialise()`** when **`PG_VERSION`** exists and only starts the server. Verified: **`npm run db:local`** + **`npm run dev`** → **`GET /api/public/organizations`** returns a JSON array and the org picker works.
- **Schema drift fix (local):** API crash `P2022` (`Organization.checkInOnlyPreferred` missing) caused the locations banner. Ran **`apps/api npm run db:push`** against local Postgres (`127.0.0.1:5433`); `/api/public/organizations` now returns data again.
- **Task 1 (deploy / blank page):** `OrgContext` no longer treats HTML (same-origin `/api` fallback) as JSON; detects missing **`VITE_API_BASE_URL`** in production builds and shows an amber **deploy banner** (`deployMissingApiBase` / `deployBadResponse`). **`apiBase.ts`** documents correct API host example. **`render.yaml`** comments clarify **`apps/web/dist`** publish path and add **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** to API env template.
- **Task 2 (auth):** Admin: **`Organization.adminPasswordHash`** (bcrypt) or **bootstrap** secret (`ADMIN_BOOTSTRAP_PASSWORD` → `ADMIN_PASSWORD` → default **`11213Aron`**); JWT **`adminMustChangePassword`** until **`POST /api/admin/account/password`**; middleware blocks other admin routes until changed. Rabbi/member unchanged. JWT **`24h`**. **`timingSafeString`**, **`bootstrapAdminPassword.ts`**, web **`/admin/change-password`**, **`adminJwt.ts`**.
- **Web login UI:** **`AdminLogin`** password field; **`RabbiLogin`** password field; **`MemberLogin`** PIN field and payload. English strings + **`rabbiLogin.passwordRequired`**. **`OrgProvider`** clears **`minyan_rabbi_token`** on org change.
- **`docs/PROGRAMMER_HANDOFF.md`:** Security section updated to reflect restored credential checks (date line remains **2026-05-03** per doc convention).
- **Punch UI PIN parity fix (check-in + check-out):** `apps/web/src/components/PunchIdentityForm.tsx` now includes a PIN input inline with the phone row, validates PIN length (4+), and sends `pin` in both `/api/punch/in`, `/api/punch/out-public`, and `/api/punch/out-location-default` requests so public check-in/out match backend PIN enforcement.
- **No default autofill for phone/PIN:** `apps/web/src/pages/MemberLogin.tsx` and `apps/web/src/components/PunchIdentityForm.tsx` now force blank fields on mount and use anti-autofill attributes (`autoComplete="new-password"` + unique input names) so phone/PIN do not start prefilled from browser memory.
- **Global scroll/menu visibility fix:** `apps/web/src/App.tsx` now uses a viewport-locked shell (`h-dvh max-h-dvh overflow-hidden`) with scroll delegated to `main` (`min-h-0 overflow-y-auto`, larger bottom safe-area padding) so pages like Member Billing can scroll fully above the fixed bottom navigation.
- **Debug handoff notes added:** `docs/PROGRAMMER_HANDOFF.md` now includes `### Debugging issues` with this chat’s recurring problems (missing PIN in punch flows, autofill defaults, scroll hidden behind bottom nav) and a cross-screen regression checklist.
- **Standing policies added (Cursor):**
  - `.cursor/rules/standing-debug-policy.mdc` (always-apply rule) now enforces cross-screen/menu regression checks and requires documenting recurring bugs.
  - `.cursor/hooks.json` + `.cursor/hooks/git-reminder.ps1` now add a `beforeSubmitPrompt` reminder when changes are large/stale (10+ changed files or ~1 hour since last commit), prompting a checkpoint commit.
  - Policy is reminder-only and does **not** auto-push.
- **Documentation updated:** `docs/PROGRAMMER_HANDOFF.md` now includes `## 13. Standing Cursor policies` describing the rule/hook files and behavior.

## What's Next / Blockers

- **Policy decision locked:** Keep **central-admin model** for now — one admin may manage all locations (`/api/admin/organizations` global list/create accepted behavior).
- **Local dev habit:** Keep **`npm run db:local`** running in one terminal (or use your own Postgres matching **`DATABASE_URL`**) before **`npm run dev`**. If Vite says port **5173** is in use, open the URL it prints (e.g. **5174**). If **`db:local`** exits with **`postmaster.pid` already exists**, embedded Postgres is already running for that data dir — do not start a second copy; stop the existing process first if you need a clean restart.
- **Render dashboard (manual):** Set **`VITE_API_BASE_URL`** on the static service to the live API origin (e.g. `https://minyan-pays.onrender.com`), set **`ADMIN_PASSWORD`** / **`RABBI_PASSWORD`** on the API service, **redeploy both** so the browser bundle embeds the API URL and logins work.
- **Local dev:** Copy **`apps/api/.env.example`** → **`.env`** and set **`ADMIN_PASSWORD`** (and rabbi fallback if needed) before admin/rabbi login.
- **Directive remainder:** Task 3 (TefillahType + UI), 4–11 per **`MINYANPAYS_COMPLETION_DIRECTIVE`** — design-system components, weekly export columns, treasury budget check, kiosk route, demo seed, full i18n for new strings.
- **Cross-tenant audit:** Confirm every protected route enforces org id + role vs JWT (directive §2).

## Notes / Context

- **Git:** Latest pushed commit is **`dc5b757`** (embedded Postgres restart guard + status notes) on **`origin/main`** and **`cur/main`**.
- **Deploy automation blocker:** No authenticated Render control path in this environment. `render` command available after install is an unrelated template-rendering CLI, not Render.com deployment CLI/API tooling.
- **Admin password:** Bootstrap default **`11213Aron`** when `Organization.adminPasswordHash` is null (override with **`ADMIN_BOOTSTRAP_PASSWORD`** or **`ADMIN_PASSWORD`**). First login must set a real password via **`/admin/change-password`** (`POST /api/admin/account/password`).
- **Password verification (local):** `POST /api/auth/admin` with `organizationSlug: "dovrey-evrit"` and `password: "11213Aron"` succeeds and returns `mustChangePassword: true`; if web shows **Invalid password**, the target environment likely has `adminPasswordHash` already set or points to a different API/build.
- **Current check:** On localhost (`:5175`) backend still accepts `11213Aron` via direct API call, so remaining mismatch is likely manual entry/input issue in the browser rather than server config.
- **Resolved locally:** Admin bootstrap login succeeded; password was changed via `/admin/change-password`, so this org now uses stored `adminPasswordHash` (bootstrap no longer valid for that org).
- **Production check (remote):** `https://minyan-pays.onrender.com/api/health` returns `{"ok":true,"service":"minyan-pays-api"}` and `https://minyan-pays.onrender.com/api/public/organizations` returns org JSON. Static site domain `https://minyanpays.com/admin` serves app HTML (status header 404 from host rewrite behavior) and needs browser login verification with the new admin password.
- **Latest live retest:** API health and organizations endpoints are still passing in production; web root (`/`) is `200`; `/admin` responds with app HTML but returns HTTP `404` header, indicating routing works visually but static-route status behavior should be normalized in Render rewrites/redirect settings.
- **Docs discrepancy noted:** `PROGRAMMER_HANDOFF.md` contains older language about auth being disabled, but current code/path has credential checks restored (admin bcrypt/bootstrap, rabbi bcrypt/fallback, member PIN bcrypt) and this should be reconciled in docs to avoid launch confusion.
- **Security hardening pass (post-review):**
  - `apps/api/src/routes/punch.ts` now enforces PIN verification (`bcrypt`) for public punch-in / punch-out identity flows (phone-only path removed).
  - `apps/api/src/env.ts` now fails startup when required env vars are missing (`DATABASE_URL`, `JWT_SECRET`, except in test mode).
  - Build validated (`npm run build --workspace apps/api`), and auth negative checks return `401` for bad admin password and bad member PIN.
- **Production user confirmation:** Login + password change succeeded at `https://minyanpays.com/admin` using updated admin password.
- **Comms prep:** Added copy-ready sections in `docs/AI_VERIFICATION_CHECKLIST.md` under `## Answer for Gemini` and `## Answer for Copilot` so external AI reviewers get consistent, up-to-date status.
- **Copilot reconciliation doc pass:** Added `## Copilot PDF reconciliation (May 2026)` to `docs/AI_VERIFICATION_CHECKLIST.md` with three buckets: Done now, Still open, and N/A/advisory (including rationale).
- **Remaining-open issues progress (in-session):**
  - Added `docs/SECURITY_ROUTE_AUDIT.md` with full route protection inventory and cross-tenant isolation review, including explicit exceptions and follow-up recommendations.
  - Fixed stale auth wording in `docs/PROGRAMMER_HANDOFF.md` (`ADMIN_PASSWORD` env behavior now accurately described).
  - Updated `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` Task 2 preface from "auth disabled" to historical note + current-state guidance.
  - Updated `docs/AI_VERIFICATION_CHECKLIST.md` reconciliation section to mark route inventory / cross-tenant artifact as completed and narrow remaining open items.
- **Next operator step:** normalize static SPA deep-link status on Render (`/admin` should return `200` with rewrite to `/index.html`), then re-test production status codes.
- **Reviewer report:** Full sprint summary for double-checking (done vs remaining vs ops) — **`docs/CLAUDE_REVIEW_REPORT.md`**.
- **Claude Code:** CLI installed globally; launch + **`claude auth login`** — **`docs/CLAUDE_CODE_SETUP.md`**. Root context — **`CLAUDE.md`**. First-run summary (same intent as interactive prompts; use if CLI not authenticated) — **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`**.
- **GitHub Copilot / Google Gemini:** How to review & test, prompts, access limits — **`docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md`**.
- **Brief checklist for other AIs (verify + test + suggest):** **`docs/AI_VERIFICATION_CHECKLIST.md`**.
- Health check returns **`{ ok: true, service: "minyan-pays-api" }`** (not `{ status: "ok" }`).
- **`lucide-react`** is not in **`apps/web/package.json`** yet — Task 8 / design system will add it.

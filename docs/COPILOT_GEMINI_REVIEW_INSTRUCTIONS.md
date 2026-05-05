# Instructions for GitHub Copilot & Google Gemini — Review & Test MinyanPays

**Parent playbook (3+ AIs, lanes, cadence):** [MULTI_AI_DEVELOPMENT_WORKFLOW.md](./MULTI_AI_DEVELOPMENT_WORKFLOW.md).

Use this document when you ask **Copilot** (in VS Code / Cursor / GitHub) or **Gemini** (web app, Android Studio, or **Gemini CLI**) to **review**, **reason about**, or **suggest tests** for this repository.

---

## 1. What you are reviewing

**Repository:** `NeVoTM/minyan-pays` (or local clone at `C:\Users\17274\minyan-pays`).

**Product:** MinyanPays — synagogue minyan attendance, rabbi confirm/reject, treasury, Zelle-oriented weekly export (manual payout tracking, not in-app card charges).

**Canonical docs (read in this order):**

| Order | File | Purpose |
|-------|------|---------|
| 1 | `CLAUDE.md` | Short project context at repo root |
| 2 | `docs/PROGRAMMER_HANDOFF.md` | Architecture, auth, schema pointers |
| 3 | `docs/CLAUDE_REVIEW_REPORT.md` | What is done vs remaining vs ops |
| 4 | `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` | Full sprint backlog & checklist |
| 5 | `docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md` | Severity-ranked gaps |

**Recent changes (high level):** Production deploy UX (`VITE_API_BASE_URL`, org fetch hardening); restored auth (`apps/api/src/routes/auth.ts`, JWT 24h); login UI passwords/PIN; `docs/` updates.

---

## 2. Prompt you can paste (Copilot or Gemini)

Copy everything inside the box:

```
You are reviewing the MinyanPays monorepo (React+Vite web in apps/web, Express+Prisma API in apps/api).

Goals:
1) Cross-check docs/CLAUDE_REVIEW_REPORT.md and docs/MINYANPAYS_COMPLETION_DIRECTIVE.md against the actual code — flag stale doc claims.
2) Review apps/api/src/routes/auth.ts and apps/api/src/middleware/auth.ts for credential and JWT handling; note any cross-tenant risks if routes skip org checks.
3) Review apps/web/src/context/OrgContext.tsx and apps/web/src/lib/apiBase.ts for production API URL behavior.
4) List concrete test steps (commands + what to click) to validate admin, rabbi, and member login after setting ADMIN_PASSWORD and VITE_API_BASE_URL locally.
5) Do NOT invent secrets; reference apps/api/.env.example for variable names only.

Output format:
- Summary (5 bullets)
- Doc vs code mismatches
- Security notes (Critical / High / Medium)
- Recommended npm/prisma commands to run locally
- Anything still ambiguous that needs a human to verify on Render production
```

---

## 3. GitHub Copilot — access & setup

| Need | Why |
|------|-----|
| **Workspace = repo root** (`minyan-pays`) | Copilot Chat uses open files + indexed workspace; wrong folder = wrong answers. |
| **Git clone or synced copy** | Copilot sees local files; it does not automatically read private GitHub unless the IDE is connected and files are open. |
| **Optional: GitHub Copilot Business + repo access** | For org-owned private repos, your admin must enable Copilot for your account. |
| **No separate “test server” for Copilot** | Copilot does **not** run `npm test` by itself. **You** run commands in the integrated terminal; paste errors/output back into Copilot Chat. |

**Suggested workflow**

1. Open the repo in **Cursor** or **VS Code** with Copilot enabled.
2. Open `docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md` and the files listed in §1.
3. Paste the prompt from §2 into **Copilot Chat**.
4. Run locally (you): `npm install` at repo root, then `npm run build`; optionally `npm run dev` with API `.env` — paste failures into chat.

**Limits:** Copilot won’t log into Render, won’t know production secrets, and shouldn’t be given real passwords or `DATABASE_URL` values.

---

## 4. Google Gemini — access & setup

| Variant | What it can see | Setup |
|---------|------------------|--------|
| **Gemini (web)** — [gemini.google.com](https://gemini.google.com) | Only what you **paste or upload** | Upload a **zip of the repo** (exclude `node_modules`, `.env`, `dist`, `apps/api/.env`) **or** paste key files (`auth.ts`, `CLAUDE_REVIEW_REPORT.md` excerpts). |
| **Gemini in Android Studio / IDX** | Project if opened there | Same as any IDE: open clone; no automatic GitHub private access without auth. |
| **Gemini CLI** (if installed) | Files in cwd you allow | Run from repo root; follow Gemini CLI docs for permissions. |

**Suggested workflow (web Gemini)**

1. Zip the repo excluding: `node_modules/`, `**/dist/`, `.env`, `**/.env`, `apps/api/prisma/migrations` optional (large).
2. Upload zip **or** paste §2 prompt + paste contents of `docs/CLAUDE_REVIEW_REPORT.md` + `apps/api/src/routes/auth.ts`.
3. Ask follow-ups only with **redacted** env (e.g. “API URL is set to https://example.onrender.com” without tokens).

**Limits:** Gemini cannot hit your localhost unless you use a bridge you control; it cannot authenticate to GitHub or Render for you. For **live** testing, a human runs commands locally.

---

## 5. What neither tool can do alone

- Apply fixes to **your** production Render dashboard (`VITE_API_BASE_URL`, secrets).
- Run integration tests against **your** PostgreSQL without credentials you provide (avoid pasting production URLs with passwords).
- Guarantee minyanpays.com behavior without you running browser smoke tests.

---

## 6. Safe sharing checklist

- [ ] Remove or never paste: real **`ADMIN_PASSWORD`**, **`JWT_SECRET`**, full **`DATABASE_URL`**, API keys.
- [ ] OK to share: **`render.yaml`**, **`apps/api/.env.example`**, source under `apps/` and `docs/`.
- [ ] For test instructions: say “set variables per `.env.example` locally” instead of values.

---

## 7. Optional: commands for a human or CI

From repo root:

```bash
npm install
npm run build
```

API only:

```bash
cd apps/api && npm run build
```

Web only:

```bash
cd apps/web && npm run build
```

Full dev (two processes):

```bash
npm run dev
```

Database operations require a valid **`DATABASE_URL`** (local or cloud); do not commit real URLs.

---

*Add this file to review bundles so Copilot/Gemini share the same instructions.*

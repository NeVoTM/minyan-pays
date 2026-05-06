# Brief checklist — verify & test (for other AIs)

**Purpose:** External assistants **check** the implementation, **test** what they can, **comment** on risks and improvements. The human merges all answers into **one file** for Cursor.

**Repo:** `minyan-pays` (monorepo root). **Scope:** MinyanPays only (not EffortPays / ShiurPays / reflections unless explicitly asked).

---

## Instructions for other AIs — what to do

1. **Orient:** Read **§ Read first** and skim **§ Implementation inventory** so you know what was changed and why.
2. **Check (code):** Walk **§ Code review checklist** and the inventory paths. Open files; confirm behavior matches descriptions. Note mismatches, dead code, or regressions.
3. **Test (commands):** If you have a shell in the repo, run **§ Build / static checks**. If API + DB + `.env` exist locally (you are **not** given secrets), run **§ Behavioral tests** or describe exact `curl`/Postman steps for a human.
4. **Test (production):** You usually **cannot** log into Render. State what a human should verify (env vars, redeploy) using **§ Production / hosting** notes.
5. **Comment:** Give **actionable** feedback: file path + what to change + why. Avoid vague advice.
6. **Consolidate-ready:** Use **§ Output format** so the human can paste many AI replies into one Cursor brief.

**Do not:** paste or request real **`DATABASE_URL`**, **`ADMIN_PASSWORD`**, **`JWT_SECRET`**, or API keys. Use **`apps/api/.env.example`** for variable **names** only.

**What you need:**

| Your environment | Typical access |
|------------------|----------------|
| IDE assistant (Copilot, Cursor) | Open workspace at repo root; read files; user runs terminal. |
| Web chat (Gemini, Claude, ChatGPT) | User uploads a zip **excluding** `node_modules`, `dist`, `.env`, or pastes file excerpts + this checklist. |

---

## Implementation inventory — files changed & purpose

*Use this as the ground truth for “what was implemented” in the auth + deploy-UX pass. If HEAD differs, note drift in your report.*

### Security & authentication (API + web)

| File | Purpose |
|------|--------|
| `apps/api/src/routes/auth.ts` | Enforces **admin** password (`ADMIN_PASSWORD`), **rabbi** password (`Organization.rabbiPasswordHash` or `RABBI_PASSWORD`), **member** PIN (`bcrypt.compare` vs `User.pinHash`). |
| `apps/api/src/middleware/auth.ts` | JWT signing; **`expiresIn: "24h"`** for admin, rabbi, member; payload includes `organizationId` and role. |
| `apps/api/src/lib/timingSafeString.ts` | Constant-time string comparison for env passwords. |
| `apps/web/src/pages/AdminLogin.tsx` | Collects and sends **password** to `POST /api/auth/admin`. |
| `apps/web/src/pages/RabbiLogin.tsx` | Collects and sends **password** to `POST /api/auth/rabbi`. |
| `apps/web/src/pages/MemberLogin.tsx` | Collects and sends **PIN** to `POST /api/auth/member`. |
| `apps/api/.env.example` | Documents **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`**, **`WEB_ORIGIN`**, **`PORT`**, etc. |

### Deploy / SPA client behavior

| File | Purpose |
|------|--------|
| `apps/web/src/lib/apiBase.ts` | Builds API URLs; **`VITE_API_BASE_URL`** in prod; **`isMissingProductionApiBase()`** when unset at build time. |
| `apps/web/src/context/OrgContext.tsx` | Fetches org list safely (avoid treating HTML as JSON); **deploy banners**; clears **`minyan_rabbi_token`** when org changes. |
| `apps/web/src/App.tsx` | Shows **amber banner** for missing API base / bad API response. |
| `apps/web/src/locales/en.json` | Copy for deploy banners, PIN, rabbi password hints. |
| `render.yaml` | Blueprint hints; API env placeholders including **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`**; static **`rootDir`**, **`staticPublishPath: dist`**, SPA rewrite. |

### Documentation & project state

| File | Purpose |
|------|--------|
| `docs/PROGRAMMER_HANDOFF.md` | Canonical architecture + current auth summary. |
| `docs/CLAUDE_REVIEW_REPORT.md` | Done vs remaining vs manual ops for the sprint. |
| `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` | Full product backlog (may lag code in places). |
| `docs/CLAUDE_CODE_SETUP.md`, `docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md` | Claude Code launch + first-run Q&A. |
| `docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md` | Copilot/Gemini review prompts and safe-sharing notes. |
| `CLAUDE.md` | Short root context for Claude Code. |
| `PROJECT_STATUS.md` | Where the team left off. |
| `API_SPECIFICATION.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md` | Redirect / align with handoff (verify they don’t contradict `auth.ts`). |

**Optional noise:** `docs/chat#2.md` (if present) is a chat archive, not a spec — ignore for verification unless asked.

---

## Read first (~5 min)

| File | Why |
|------|-----|
| `docs/CLAUDE_REVIEW_REPORT.md` | Done vs pending vs ops |
| `docs/PROGRAMMER_HANDOFF.md` | Architecture + auth wording |
| `CLAUDE.md` | Ultra-short context |

---

## Code review — confirm implementation

| # | Verify | Paths |
|---|--------|--------|
| 1 | Admin password required | `auth.ts`, `AdminLogin.tsx` |
| 2 | Rabbi password / hash path | `auth.ts`, `RabbiLogin.tsx` |
| 3 | Member PIN + bcrypt | `auth.ts`, `MemberLogin.tsx` |
| 4 | JWT 24h | `middleware/auth.ts` |
| 5 | Timing-safe env compare | `timingSafeString.ts` |
| 6 | Prod API URL + banners | `apiBase.ts`, `OrgContext.tsx`, `App.tsx` |
| 7 | Blueprint / env names | `render.yaml`, `.env.example` |

**Red flags:** Token issued without credential check; missing PIN field; silent failure when `VITE_API_BASE_URL` absent in production build.

---

## Build / static checks (if you can run commands)

Repo root (Node 18+):

```bash
npm install
npm run build
```

Optional API only:

```bash
cd apps/api && npm run build
```

**Pass:** root `npm run build` exits 0.

---

## Behavioral tests (local API + DB; no secrets in chat)

With valid `apps/api/.env` (human configures; you only describe):

| Test | Expected |
|------|----------|
| `POST /api/auth/admin` wrong/missing password | **401**, no token |
| `POST /api/auth/member` wrong PIN | **401** |
| `POST /api/auth/rabbi` wrong password | **401** |
| `GET /api/health` | **200**, JSON includes **`ok`** (e.g. `{ "ok": true, "service": "..." }`) |

---

## Production / hosting (informational — you verify by checklist, not by secret access)

- Static site: **`VITE_API_BASE_URL`** set at **build** time; redeploy after change.
- API: **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** (if no rabbi hash), **`JWT_SECRET`**, **`DATABASE_URL`**, **`WEB_ORIGIN`** (origins for CORS).
- Smoke: site loads JS; `/punch`, `/admin` deep links work (SPA + `404.html` on host).

---

## Cross-tenant / security (review)

- JWT includes **`organizationId`** — `middleware/auth.ts`.
- Spot-check protected routes: resource org vs token org. List **gaps**; full audit is out of scope for a quick pass.

---

## Doc consistency

- `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` **Task 2** may still describe auth as “disabled”; compare to **`auth.ts`** and **`PROGRAMMER_HANDOFF.md`**. Call out **stale** lines.

---

## Output format (for the human’s single consolidated file)

Reply in this structure:

1. **Summary** (3–6 bullets) — matches intent vs gaps  
2. **Issues** — Critical / High / Medium / Low (or “none”)  
3. **Tests run** — command + result, or “not run (reason)”  
4. **Comments** — design, DX, security, or product observations (numbered)  
5. **Suggestions for Cursor** — file paths + concrete change intent  
6. **Questions** — only if blocked without prod/local access  

**Never** paste real credentials.

---

*End of checklist.*

---

## Answer for Gemini

Use this as the current source of truth:

- Production auth is working. Admin login and password change succeeded at `https://minyanpays.com/admin`.
- Auth is enabled in code (not open/disabled):
  - Admin: bcrypt hash if set, otherwise bootstrap fallback path.
  - Rabbi: bcrypt hash or env fallback.
  - Member: PIN verified with bcrypt.
- Security hardening was added after review:
  - `apps/api/src/routes/punch.ts` now enforces PIN verification in public punch identity flows (phone-only acceptance removed).
  - `apps/api/src/env.ts` now fails startup when `DATABASE_URL` or `JWT_SECRET` is missing (except test mode).
- Live API checks pass:
  - `https://minyan-pays.onrender.com/api/health`
  - `https://minyan-pays.onrender.com/api/public/organizations`

Please treat any older text claiming "auth disabled" as stale and superseded.

## Answer for Copilot

Thanks for the review. Here is what was verified and actioned:

- Confirmed: docs drift existed; some documents still implied disabled auth.
- Confirmed and fixed: remaining auth gap in public punch flow.
  - Updated `apps/api/src/routes/punch.ts` to require valid PIN (`bcrypt`) for public punch identity checks.
- Added required env guard:
  - Updated `apps/api/src/env.ts` to throw on missing `DATABASE_URL` or `JWT_SECRET` (non-test).
- Validation completed:
  - `npm run build --workspace apps/api` passes.
  - Negative auth checks return `401` for wrong admin password and wrong member PIN.
- Production confirmation:
  - Successful admin login + password change at `https://minyanpays.com/admin`.

Please update prior conclusions to "auth enforced" and mark the phone-only punch bypass as resolved.

## Copilot PDF reconciliation (May 2026)

This section maps Copilot PDF findings to current repo state so external reviewers do not repeat stale items.

### Done now

- **Public punch auth gap closed**: `apps/api/src/routes/punch.ts` now requires PIN verification (`bcrypt`) for public punch identity flows.
- **Startup env validation added**: `apps/api/src/env.ts` now fails startup when `DATABASE_URL` or `JWT_SECRET` is missing (except test mode).
- **Negative auth checks verified**:
  - wrong admin password -> `401`
  - wrong member PIN -> `401`
- **Production auth smoke confirmed**: admin login + password change succeeded on `https://minyanpays.com/admin`.
- **Route protection + org-scope artifact added**: see `docs/SECURITY_ROUTE_AUDIT.md` for full route inventory and cross-tenant review notes.

### Still open (needs explicit follow-up)

- **Docs harmonization across all files**: key docs were updated, but legacy wording may still exist in older summaries or backlog docs and should be aligned in one cleanup pass.
- **Static route status behavior on production `/admin`**: page renders app shell but HTTP status can show `404` due to static rewrite behavior; functionally acceptable for SPA, but should be normalized for cleaner monitoring/SEO semantics.

### N/A or advisory (not strict blockers by themselves)

- **`ADMIN_PASSWORD` as startup-required env**: not always required by design because admin may authenticate via stored `Organization.adminPasswordHash` or bootstrap override path; requiring it unconditionally would block valid deployments.
- **UI style suggestions (card/icon/button consistency)** from Copilot PDF are product/UX enhancements, not security/auth correctness blockers.
- **Render dashboard automation from this agent session**: direct deploy clicks and private dashboard actions are account-scoped and cannot be completed solely from local repo tools; treated as operator step, not code defect.

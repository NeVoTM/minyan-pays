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

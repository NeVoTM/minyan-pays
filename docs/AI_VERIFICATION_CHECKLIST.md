# Brief checklist — verify & test (for other AIs)

**Purpose:** Another assistant reviews what was implemented, runs checks if possible, and suggests improvements. The human merges answers into **one file** for Cursor.

**Repo:** `minyan-pays` (root = monorepo). **Scope:** MinyanPays only.

---

## 0. Read first (5 min)

| File | Why |
|------|-----|
| `docs/CLAUDE_REVIEW_REPORT.md` | What’s marked done vs pending |
| `docs/PROGRAMMER_HANDOFF.md` | Architecture + current auth description |
| `CLAUDE.md` | Short project context |

---

## 1. Code review — confirm implementation

Check these paths exist and match the **intent** (not necessarily line-by-line with an old spec):

| # | Check | Paths / notes |
|---|--------|----------------|
| 1 | Admin login requires a password vs env | `apps/api/src/routes/auth.ts` — `ADMIN_PASSWORD`, timing-safe compare |
| 2 | Rabbi login verifies org hash or env fallback | Same file — `rabbiPasswordHash` / `RABBI_PASSWORD` |
| 3 | Member login requires PIN + bcrypt | Same file — `pin`, `bcrypt.compare` vs `pinHash` |
| 4 | JWT expiry 24h for all roles | `apps/api/src/middleware/auth.ts` — `expiresIn: "24h"` |
| 5 | Timing-safe string helper | `apps/api/src/lib/timingSafeString.ts` |
| 6 | Web sends password/PIN on login | `apps/web/src/pages/AdminLogin.tsx`, `RabbiLogin.tsx`, `MemberLogin.tsx` |
| 7 | Production API URL handling + user-visible errors | `apps/web/src/lib/apiBase.ts`, `context/OrgContext.tsx`, `App.tsx` (deploy banner) |
| 8 | Blueprint / env hints | `render.yaml`, `apps/api/.env.example` |

**Flag:** Anything that still looks like “issue token without password,” missing PIN, or client calling same-origin `/api` without documenting `VITE_API_BASE_URL`.

---

## 2. Build / static checks (if you can run commands)

From **repo root** (needs Node 18+):

```bash
npm install
npm run build
```

From **`apps/api`** (optional, needs valid `DATABASE_URL` in `.env` for DB commands):

```bash
npm run build
```

**Pass criteria:** `npm run build` at root completes without errors.

---

## 3. Behavioral tests (human or tool with local stack)

If API + DB are configured (`apps/api/.env` from `.env.example` — **no secrets in chat**):

| Test | Expected |
|------|----------|
| `POST /api/auth/admin` with wrong/missing password | **401**, not 200 with token |
| `POST /api/auth/member` with wrong PIN | **401** |
| `POST /api/auth/rabbi` with wrong password | **401** |
| `GET /api/health` | **200**, JSON with `ok` (shape may be `{ ok: true, ... }`) |

**Production (informational only):** Static site must have **`VITE_API_BASE_URL`** set at **build** time; API needs **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** (if no rabbi hash), **`WEB_ORIGIN`**, **`JWT_SECRET`**, **`DATABASE_URL`**. You cannot verify secrets — only describe what must be true.

---

## 4. Cross-tenant / security (review only)

- JWT includes `organizationId` — confirm in `middleware/auth.ts`.
- Skim a few protected routes: do they tie resource `organizationId` to the token’s org? **Note gaps**; full audit is large.

---

## 5. Doc consistency

- `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` **Task 2** may still say auth is “disabled” — **code may have moved on**. Call out **stale doc lines** vs `auth.ts` / `PROGRAMMER_HANDOFF.md`.

---

## 6. Output format (for the human’s single consolidated file)

Please reply in this structure:

1. **Summary** (3–6 bullets) — what matches intent vs what doesn’t  
2. **Issues** — Critical / High / Medium / Low (or “none”)  
3. **Tests run** — commands + pass/fail, or “not run (reason)”  
4. **Suggestions** — concrete next steps for Cursor (file names + change intent)  
5. **Questions** — only if something is ambiguous without prod access  

**Do not** paste real passwords, full `DATABASE_URL`, or API keys.

---

*End of checklist.*

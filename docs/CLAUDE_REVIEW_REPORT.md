# MinyanPays Sprint — Report for External Review (e.g. Claude)

*Generated for double-checking against `MINYANPAYS_COMPLETION_DIRECTIVE` and repo state.*

---

## 1. Purpose

This document summarizes:

- What the sprint **commits to deliver** (scope from the completion directive).
- What is **already implemented in code** (as of the last Cursor pass).
- What **remains** to build or verify.
- **Operational steps** you must perform outside git (Render dashboard, secrets).

Canonical product/tech context remains **`docs/PROGRAMMER_HANDOFF.md`** (`*Last updated: 2026-05-03*`). The completion directive is **`docs/MINYANPAYS_COMPLETION_DIRECTIVE.md`** (same content as the sprint PDF / pasted directive).

---

## 2. Scope Lock (Do Not Expand)

**In scope:** Minyan attendance, payouts, treasury, rabbi/admin/member flows for MinyanPays only.

**Explicitly out of scope this sprint:** reflections, voice, prize store, ShiurPays/EffortPays rebranding, Stripe/subscriptions, PlanLevel/ProgramType schema churn, AI features — see directive §“WHAT NOT TO BUILD”.

---

## 3. Done in Code (reviewer checklist)

### Task 1 — Deployment / “blank page” mitigation

| Item | Status | Notes |
|------|--------|--------|
| Repo `render.yaml` static section uses `rootDir: apps/web`, `staticPublishPath: dist`, SPA rewrite `/*` → `/index.html` | ✅ In repo | Equivalent to publish dir **`apps/web/dist`** when using blueprint `rootDir`. |
| `404.html` after build | ✅ In repo | `apps/web/package.json` build runs `node scripts/spa-render-404.mjs` (copies `index.html` → `404.html`). |
| Production API base URL | ⚠️ Host config | **Vite embeds env at build time.** Static service must set **`VITE_API_BASE_URL`** to the **live API origin** (e.g. `https://minyan-pays.onrender.com`) and **redeploy** the static site. |
| Client handling when API URL missing / HTML returned instead of JSON | ✅ In repo | `OrgContext` + `App.tsx` deploy banners; `apiBase.ts` (`isMissingProductionApiBase`). |

### Task 2 — Authentication & JWT

| Item | Status | Notes |
|------|--------|--------|
| Admin login verifies secret | ✅ In repo | `POST /api/auth/admin` requires **`ADMIN_PASSWORD`** (`apps/api/src/routes/auth.ts`), timing-safe compare via `apps/api/src/lib/timingSafeString.ts`. |
| Member login verifies PIN | ✅ In repo | Requires **`pin`**; **`bcrypt.compare`** vs **`User.pinHash`** (`bcryptjs`). |
| Rabbi login | ✅ In repo | **`Organization.rabbiPasswordHash`** if set; else **`RABBI_PASSWORD`** env. |
| JWT expiry **24h** | ✅ In repo | `apps/api/src/middleware/auth.ts` — admin, rabbi, member all **`expiresIn: "24h"`** (was 12h / 30d). |
| Payload includes role + **`organizationId`** | ✅ Pre-existing | Still **`ADMIN` / `RABBI` / `MEMBER`** (uppercase) — matches existing middleware. |
| Web login forms send secrets | ✅ In repo | `AdminLogin`, `RabbiLogin`, `MemberLogin` updated; English i18n keys added where needed. |
| `.env.example` | ✅ In repo | `apps/api/.env.example` includes **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`**, **`WEB_ORIGIN`**, **`PORT`**. |
| Cross-tenant enforcement on **every** route | ⚠️ Partial | Login embeds `organizationId`; **full audit** of all protected routes vs JWT/org is **not** completed — directive §2 asks for middleware consistency everywhere. |

### Docs touched

- `docs/PROGRAMMER_HANDOFF.md` — security paragraph updated to describe restored auth (date line remains **2026-05-03**).
- `PROJECT_STATUS.md` — sprint progress log.

---

## 4. Manual / Hosting Actions (not in git)

Reviewer should confirm:

| Action | Owner |
|--------|--------|
| Render **static** service: **`VITE_API_BASE_URL`** = production API origin; **redeploy** web after setting. | Deployer |
| Render **API** service: **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** (fallback rabbi), existing **`JWT_SECRET`**, **`DATABASE_URL`**, **`WEB_ORIGIN`** (comma-separated origins incl. `https://minyanpays.com`, `www`, preview URLs if needed). | Deployer |
| Smoke: `minyanpays.com` loads JS; `/punch`, `/admin` deep links work after SPA rewrite + `404.html`. | QA |

**Note:** Live API health returns **`GET /api/health`** → **`{ "ok": true, "service": "minyan-pays-api" }`** — not `{ "status": "ok" }` as in some directive wording.

---

## 5. Remaining Work (directive Tasks 3–11 — planned, not yet implemented as a full pass)

Below is what **still needs to be done** to match the completion directive. Use this as the master backlog for second review.

### Task 3 — Three tefillos

- Prisma: **`TefillahType`** enum + **`MinyanSession.tefillahType`**; migration.
- Rabbi UI: quick-create **Shacharis / Mincha / Maariv** for today.
- Labels everywhere; weekly report grouped by tefillah + terminology (**Minyan**, **Shacharis**, **Mincha**, **Maariv**, **Rabbi / Gabbai**, etc.).

### Task 4 — First nine slots

- Member punch success UI: slot #, bonus copy when applicable.
- Rabbi today view: **First Nine** row (9 slots).
- **`apps/api/src/lib/earnings.ts`** logic verified vs directive.

### Task 5 — Weekly Zelle export

- CSV column order and naming per directive §5a.
- Rabbi weekly report: export button + filename **`minyanpays-week-YYYY-MM-DD.csv`**.
- Treasury: lock **banner** (export allowed); **budget check** before payout confirmation; **`Mark Week as Paid`** flow.

### Task 6 — Member balance screen

- Wallet-style summary + history cards + payout method reminder per directive.

### Task 7 — Rabbi dashboard polish

- Today on load; confirm/reject one tap; session summary line; **`Organization.rabbiBanner`** on punch + balance.

### Task 8 — Mobile + kiosk

- Design tokens (#2563eb, cards, buttons, **lucide-react** — dependency not added yet).
- **`/punch/kiosk`**: numeric keypad UX, 3s success then reset, portrait.

### Task 9 — Admin org setup

- Unified org settings form; member CSV import; **`seed-demo.ts`** + defaults **`SYNAGOGUE` / FREE** per schema.

### Task 10 — Empty / error states

- All listed empty and error messages.

### Task 11 — i18n

- Hebrew (and parity) for punch, balance, rabbi prompts; toggle on punch without login — partial/existing; directive asks completion.

---

## 6. Completion checklist (directive § COMPLETION CHECKLIST)

Use this table to tick items after verification:

| Section | Items | Code / ops status |
|---------|--------|-------------------|
| **Deployment** | Full React app load; routes on refresh; API health 200; no console errors on load | Ops + QA |
| **Auth** | Password/PIN/rabbi credential required; invalid → **401** | ✅ Implemented in API + UI — **re-verify after deploy** |
| **Core minyan flow** | Punch in/out; rabbi confirm/reject; balance; first nine; punch out | Mostly pre-existing flows — **re-verify end-to-end** |
| **Three tefillos** | Separate sessions; labels; weekly by type | ❌ Not done |
| **Payouts** | CSV format; treasury UI; lock warning; budget gate; mark paid; member paid status | ❌ Not done (partial treasury UI may exist) |
| **Kiosk** | `/punch/kiosk` route + UX spec | ❌ Not done |
| **Mobile** | 375px, no horizontal scroll, ≥48px taps, 16px inputs | Partial — needs design-system pass |
| **Admin setup** | Org form; CSV import; demo seed | ❌ Not done |
| **Design system** | Palette, cards, 4 button variants, lucide, status colors, typography | ❌ Not done |

**Definition of done (directive):** each feature must satisfy **(1)** iPhone 375px **(2)** secure auth **(3)** design system **(4)** clear state + next step.

---

## 7. Files a reviewer may inspect first

| Area | Paths |
|------|--------|
| Auth | `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/lib/timingSafeString.ts` |
| Web deploy UX | `apps/web/src/context/OrgContext.tsx`, `apps/web/src/lib/apiBase.ts`, `apps/web/src/App.tsx` |
| Login UI | `apps/web/src/pages/AdminLogin.tsx`, `RabbiLogin.tsx`, `MemberLogin.tsx` |
| Blueprint | `render.yaml` |
| Env template | `apps/api/.env.example` |

---

## 8. Summary for the reviewer

1. **Tasks 1–2 are largely addressed in code**; production **still requires** correct Render env + **redeploy** of the static app so **`VITE_API_BASE_URL`** is baked into the bundle.
2. **Tasks 3–11 remain** as substantial product/UI/schema work — see §5–6.
3. **Cross-tenant route audit** is an explicit follow-up for security parity with directive §2.
4. **Scope exclusions** in §2 must be respected for anything labeled “Phase 2”.

---

*End of report — paste or attach this file alongside `MINYANPAYS_COMPLETION_DIRECTIVE` for side-by-side review.*

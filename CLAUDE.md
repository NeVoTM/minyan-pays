# MinyanPays — Claude Code project context

## Repo

- **GitHub:** `NeVoTM/minyan-pays`
- **Local path:** `C:\Users\17274\minyan-pays`

## Stack

- **Frontend:** React + Vite + Tailwind (`apps/web`)
- **Backend:** Express + Prisma + PostgreSQL (`apps/api`)
- **Hosting:** Render — static site + web service + Postgres
- **Live site:** https://minyanpays.com

## Priority

Ship **MinyanPays** only (minyan attendance, rabbi confirm/reject, treasury, Zelle-oriented export). Full backlog: **`docs/MINYANPAYS_COMPLETION_DIRECTIVE.md`**. Architecture: **`docs/PROGRAMMER_HANDOFF.md`**. Status snapshot: **`docs/CLAUDE_REVIEW_REPORT.md`**. First-run Q&A (if CLI not logged in): **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`**. **Copilot / Gemini:** **`docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md`**.

## Auth & security (current code)

- **`POST /api/auth/admin`** — requires **`ADMIN_PASSWORD`** (env).
- **`POST /api/auth/rabbi`** — **`Organization.rabbiPasswordHash`** if set, else **`RABBI_PASSWORD`** (env).
- **`POST /api/auth/member`** — requires **PIN**; **`bcrypt.compare`** vs **`User.pinHash`**.
- JWT **`expiresIn`:** **24h**; payload includes **`organizationId`** and role (`middleware/auth.ts`).

## Deployment notes

- Static build must set **`VITE_API_BASE_URL`** to the **API origin** at **build** time, then redeploy the static service. Without it, browser calls to `/api` hit the static host and return HTML.
- **`render.yaml`:** API `rootDir` `apps/api`; web `rootDir` `apps/web`, **`staticPublishPath: dist`**, SPA rewrite `/*` → `/index.html`. **`404.html`:** created by web build (`spa-render-404.mjs`).

## Known gaps (see directive + review report)

- Remaining directive tasks: three tefillos schema/UI, first-nine UX polish, weekly CSV + treasury budget gate, member balance wallet UI, kiosk `/punch/kiosk`, admin CSV import, demo seed, design-system components + **lucide-react**, empty/error states, i18n parity.
- **Cross-tenant:** audit that every protected route matches JWT **`organizationId`** to the resource org.

## Rules (scope lock)

- Do **not** build EffortPays, reflections, voice input, prize store, Stripe/subscription flows, or unrelated program types.
- Avoid **`PlanLevel` / `ProgramType`** schema churn unless the directive explicitly requires it.
- Target **iPhone ~375px** and **tablet kiosk** for punch flows.
- Design direction: **#2563eb** primary, **#16a34a** success, **#dc2626** danger; **Inter**; **lucide-react** when icons are added.

# Render + GitHub — production reference (minyan-pays)

*Last updated: 2026-05-09*

> **AI deploy runbook:** the "Production deploy runbook" section of `.cursor/rules/standing-debug-policy.mdc` is the canonical procedure. Future schema migrations should be performed by the AI via the temporary `--accept-data-loss` flag in `render.yaml`, not by asking the user to SSH.

## Migration log

| Date | Commits | Change |
|------|---------|--------|
| 2026-05-09 | `b12b8af` (flag on) → `25c57ca` (flag off) | Added `Rabbi.passwordPlain @unique`, `Rabbi.passwordHash`, `Rabbi.isMain`; new `Shamosh` model with `passwordPlain @unique`; structured `Organization.locationCity/locationState/locationPostalCode`. Pushed via temporary `--accept-data-loss` flag dance; verified by `POST /api/auth/rabbi` returning 401 (would have been 500 on missing column). |

Keep this file updated when URLs, service names, or IDs change. **Do not paste live database passwords or full `DATABASE_URL` strings into git** — store secrets only in Render (or a password manager) and note here *where* they live.

---

## Domain

| Item | Value |
|------|--------|
| **Production domain** | `minyanpays.com` |
| **DNS** | Configure at your registrar using the **exact** records Render shows for apex + `www` after services exist. |

---

## GitHub repositories

Canonical deploy source: **`origin`** → **`NeVoTM/minyan-pays`**.

| Remote name | URL | Role |
|-------------|-----|------|
| **`origin`** | `https://github.com/NeVoTM/minyan-pays.git` | **Primary.** Connect Render to this repo, branch **`main`**. |
| **`cur`** | `https://github.com/NeVoTM/minyan-pays-cur.git` | Optional second remote (e.g. Cursor/worktree copy). Not required for Render. |

**Branch for deploy:** `main`

---

## Render — PostgreSQL

| Field | Value / notes |
|-------|----------------|
| **Render resource name** | `minyan-pays-db` |
| **Plan** | **Free** ($0/month — 256 MB RAM, 0.1 CPU, 1 GB storage) |
| **Service ID** | `dpg-d7p9c23rjlhs73et01g0-a` |
| **PostgreSQL version** | **18** (as selected at creation) |
| **Region** | **Oregon (US West)** — keep API and web services in the **same** region for private network / latency. |

### Database name and user (as recommended at setup)

| Field | Value |
|-------|--------|
| **Database name (`dbname`)** | `minyan_pays` *(or Render-generated — use whatever appears in the dashboard connection string)* |
| **User** | Random or custom — **use the Internal/External URL from Render**, not hand-rolled credentials. |

### Free tier expiry (critical)

| Warning | Detail |
|---------|--------|
| **Expiry date** | **May 29, 2026** |
| **Meaning** | On the **Free** instance type, Render may **delete** this database after that date unless you **upgrade** to a paid instance type (or migrate data elsewhere). |

**Action:** Before that date, either **upgrade** `minyan-pays-db`, **export backups** (`pg_dump` / provider tools), or **migrate** to another Postgres. Add a calendar reminder.

### Connecting the API

1. In Render Postgres → **Connect** / **Internal Database URL** (preferred if API runs on Render in the same region).
2. Set **`DATABASE_URL`** on the **API Web Service** to that URL (not committed to git).
3. Ensure Prisma uses **`postgresql`** in production (`schema.prisma` / env).
4. Run migrations after deploy: e.g. **`npx prisma migrate deploy`** (or your approved `db push` flow for early pilot — document which you used).

### Running Prisma / one-off DB commands (shell vs free tier)

**What went wrong with “web shell” automation:** Browser automation is not a full terminal; Render’s in-browser shell is built for humans, not reliable programmatic typing. That is a **tooling limitation**, not a sign your repo or Render link is wrong.

**Critical Render constraint — free API plan:** For **free** web services, Render provides **no** Dashboard Shell and **no** SSH. Only **paid** web services get shell + SSH. See [SSH and Shell Access](https://render.com/docs/ssh) (compatibility table).

**Practical ways to run DB commands anyway:**

| Approach | When to use |
|----------|-------------|
| **Deploy build / pre-deploy** | API **build** is `npm install && npx prisma generate && npm run build` (no DB). **Pre-deploy** runs **`npx prisma db push --accept-data-loss && npm run db:seed`** (see [`render.yaml`](../render.yaml)). The `--accept-data-loss` flag is required because Prisma prints “data loss” warnings for some safe changes (e.g. adding a unique index) and exits in non-interactive mode without it. If your service was created manually, paste the same **Pre-deploy command** from `render.yaml` into the Render dashboard. Prefer **`prisma migrate deploy`** with a baselined history once you move off ad-hoc `db push` for production. |
| **Local CLI against prod** | On your PC: `cd apps/api`, set **`DATABASE_URL`** to Render Postgres **external** URL (from dashboard only; never commit), then `npx prisma generate`, `npx prisma db push` or `migrate deploy`, `npm run db:seed` as needed. |
| **Upgrade API to paid** | If you want a real shell: upgrade the **API** web service to a paid instance type, then use Dashboard **Shell** or **SSH** per Render docs. |

**Seeding:** Avoid adding **`npm run db:seed`** to every production build unless the seed is **idempotent** (safe to run repeatedly). Otherwise use one-time seed from your machine or a controlled release step.

### Optional integrations (skipped at creation)

- **Datadog API key:** left empty (monitoring disabled unless you add later).
- **Datadog region:** default **US1** if you enable Datadog later.
- **Storage autoscaling:** **Disabled** at creation (can enable on paid plans if needed).
- **High availability:** **Disabled** (requires Pro+ on Render).

---

## Render — other services (fill in when created)

After you create these in the Render dashboard, add rows here so nothing is lost.

| Service type | Render name | Root / notes | Public URL |
|--------------|---------------|--------------|------------|
| **Web Service** (API) | *e.g. `minyan-pays-api`* | Root directory: **`apps/api`**. Build: install + `npx prisma generate` + `npm run build`. Start: `npm start`. | |
| **Static Site** (or Web Service) | *e.g. `minyan-pays-web`* | Root: **`apps/web`**. Build: `npm install && npm run build`. Publish: **`dist`**. | |

**API env vars (checklist — set in Render, not in repo):**

- `DATABASE_URL` — from Render Postgres
- `ADMIN_PASSWORD` / JWT / session secrets — see `apps/api/.env.example`
- `WEB_ORIGIN` or CORS — your **public web** URL (e.g. `https://minyanpays.com` or Render static URL until DNS is live)

**Frontend:** If the web app uses a **`VITE_*`** API base URL, set it to the **public API URL** Render assigns.

---

## Quick checklist (go-live)

1. [ ] Postgres `minyan-pays-db` linked; `DATABASE_URL` on API service.
2. [ ] API deploy succeeds; health route responds (e.g. `/api/health`).
3. [ ] Web deploy succeeds; points API to production URL.
4. [ ] Custom domain `minyanpays.com` + `www` attached per Render; HTTPS enabled.
5. [ ] **SPA deep links:** The web build copies `index.html` → `404.html` so paths like `/admin` and `/punch` work on Render static (see `apps/web/scripts/spa-render-404.mjs`). Alternatively add a dashboard **Rewrite**: Source `/*` → Destination `/index.html` ([docs](https://render.com/docs/redirects-rewrites)).
6. [ ] Calendar reminder before **2026-05-29** for DB upgrade / backup / migration.
7. [ ] Security: Since it was exposed in chat, rotate DB credentials after deploy.

---

## Render Blueprint (optional)

Repo root [`render.yaml`](../render.yaml) defines a **Web Service** (`apps/api`) and **Static Site** (`apps/web`) in **Oregon**. In Render: **New → Blueprint** → connect **`NeVoTM/minyan-pays`**, then set **sync: false** secrets (`DATABASE_URL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `WEB_ORIGIN`, `VITE_API_BASE_URL`). Link your existing **`minyan-pays-db`** or paste **External** `DATABASE_URL`. Deploy **API first**, then set **`VITE_API_BASE_URL`** to the API’s public **https** URL and redeploy the static site.

## Related docs

- Local setup: [`../SETUP.md`](../SETUP.md)
- Neon alternative (free Postgres): [`FREE_DATABASE_NEON.md`](./FREE_DATABASE_NEON.md)
- Data safety: [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md)
- Handoff summary: [`HANDOFF_NEXT_SESSION.md`](./HANDOFF_NEXT_SESSION.md)

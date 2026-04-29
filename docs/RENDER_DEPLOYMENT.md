# Render + GitHub — production reference (minyan-pays)

*Last updated: 2026-04-29*

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
5. [ ] Calendar reminder before **2026-05-29** for DB upgrade / backup / migration.

---

## Related docs

- Local setup: [`../SETUP.md`](../SETUP.md)
- Neon alternative (free Postgres): [`FREE_DATABASE_NEON.md`](./FREE_DATABASE_NEON.md)
- Data safety: [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md)
- Handoff summary: [`HANDOFF_NEXT_SESSION.md`](./HANDOFF_NEXT_SESSION.md)

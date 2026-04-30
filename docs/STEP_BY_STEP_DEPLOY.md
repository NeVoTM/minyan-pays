# Step-by-step: verify locally, then Render

Do steps in order. **Stop and fix** if a verification command fails.

---

## Step 1 — Code builds (no database)

**Do:** From repo root:

```powershell
cd C:\Users\17274\minyan-pays
npm run build --workspace apps/web
npm run build --workspace apps/api
```

**Pass:** Both finish with no errors.

**Note:** If `npx prisma generate` fails with `EPERM` on Windows, close other terminals running the API, stop `npm run dev`, then retry (DLL lock).

---

## Step 2 — Local PostgreSQL

**Option A — Embedded Postgres (no Docker — Windows-friendly)**  

From repo root, terminal 1:

```powershell
cd C:\Users\17274\minyan-pays
npm run db:local
```

Wait for `Embedded Postgres listening on 127.0.0.1:5433`. In `apps/api/.env` set:

`DATABASE_URL="postgresql://minyan:minyan@127.0.0.1:5433/minyan_pays"`

**Option B — Docker**

From repo root:

```powershell
docker compose up -d
```

Use `DATABASE_URL` with port **5432** (see `apps/api/.env.example`).

**Verify:** `docker ps` shows `postgres` on port `5432`.

**Option C — Cloud**  

Use Neon or Render’s **External** `DATABASE_URL` in `apps/api/.env` (see `docs/FREE_DATABASE_NEON.md` / `docs/RENDER_DEPLOYMENT.md`).

---

## Step 3 — API env and schema

**Do:**

1. Copy `apps\api\.env.example` → `apps\api\.env` if needed.
2. Set `DATABASE_URL` to match Step 2:
   - **Embedded (`npm run db:local`):** `postgresql://minyan:minyan@127.0.0.1:5433/minyan_pays`
   - **Docker:** `postgresql://minyan:minyan@localhost:5432/minyan_pays`
   - **Cloud:** your Neon/Render URL
3. Set `ADMIN_PASSWORD`, `JWT_SECRET`, `WEB_ORIGIN=http://localhost:5173` (comma-separate multiple origins for prod if needed).

**Apply schema + seed:**

```powershell
cd C:\Users\17274\minyan-pays\apps\api
npx prisma generate
npx prisma db push
npm run db:seed
```

**Pass:** `db push` reports in sync (or applies changes); seed may print “Organizations already exist” if re-run. If `db push` shows **EPERM** on a second `generate`, ignore when **`npx prisma generate`** already succeeded alone, or stop other Node processes and re-run `generate`.

---

## Step 4 — Run API and hit health

**Terminal 1:**

```powershell
cd C:\Users\17274\minyan-pays\apps\api
npx tsx watch src\index.ts
```

**Verify (new terminal):**

```powershell
curl.exe -s http://127.0.0.1:3001/api/health
```

**Pass:** JSON like `{"ok":true,"service":"minyan-pays-api"}`.

---

## Step 5 — Run web (dev) and smoke-test

**Terminal 2:**

```powershell
cd C:\Users\17274\minyan-pays\apps\web
npm run dev
```

Open the URL Vite prints (often `http://localhost:5173`). Confirm the home/org picker loads without console errors.

**Optional curl (public API):**

```powershell
curl.exe -s "http://127.0.0.1:3001/api/public/organizations"
```

**Pass:** HTTP 200 and JSON array (may be empty before seed creates org — if empty, re-check seed).

---

## Step 6 — Production-style API URL (optional)

Build web with a fake API origin to ensure bundles resolve correctly:

```powershell
cd C:\Users\17274\minyan-pays\apps\web
$env:VITE_API_BASE_URL="http://127.0.0.1:3001"
npm run build
```

**Pass:** Build succeeds (same as Step 1). On **real** deploy, set `VITE_API_BASE_URL` to your **Render API HTTPS URL** (no trailing slash).

---

## Step 7 — Render (your dashboard)

1. **Web Service** — root `apps/api`, build/start per `docs/RENDER_DEPLOYMENT.md`, env `DATABASE_URL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `WEB_ORIGIN` = your static site URL (comma-separate preview + production if needed).
2. After API deploys, copy its public URL → set **`VITE_API_BASE_URL`** on the **static site** build env.
3. **Static site** — root `apps/web`, publish `dist`.

**Pass:** Browser loads site; login/public endpoints work; no CORS errors in devtools.

---

*Last updated: 2026-04-29*

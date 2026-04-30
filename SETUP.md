# minyan-pays — local development

## Prerequisites

- **Node.js** 20+ and npm  

## Database

Prisma uses **PostgreSQL** (matches Render production).

- **Local (embedded — no Docker):** From repo root run `npm run db:local`, then set `DATABASE_URL` to the **5433** URL in `apps/api/.env.example`. Run `npx prisma db push` and `npm run db:seed` in `apps/api`.
- **Local (Docker):** `docker compose up -d` from repo root, then in `apps/api/.env` set `DATABASE_URL` from `apps/api/.env.example`. Run `npx prisma db push` and `npm run db:seed` in `apps/api`.
- **Free cloud:** **Neon** — [docs/FREE_DATABASE_NEON.md](./docs/FREE_DATABASE_NEON.md).

**Does `npm run dev` wipe the database?** No — data lives in Postgres until you reset the DB or change `DATABASE_URL`.

**Step-by-step checks:** [docs/STEP_BY_STEP_DEPLOY.md](./docs/STEP_BY_STEP_DEPLOY.md).

**Why did my members disappear?** See [docs/DATA_AND_BACKUPS.md](./docs/DATA_AND_BACKUPS.md) (resets, new clones, wrong `DATABASE_URL`, backups).

## Production (Render)

Deployed infrastructure names, GitHub remotes, Postgres service ID, free-tier expiry, and go-live checklist live in **[docs/RENDER_DEPLOYMENT.md](./docs/RENDER_DEPLOYMENT.md)**. Update that doc when Render URLs or service names change.

## One-time setup

```powershell
cd C:\Users\17274\minyan-pays
copy apps\api\.env.example apps\api\.env
# Edit apps\api\.env — DATABASE_URL (Postgres), ADMIN_PASSWORD, JWT_SECRET
npm install
cd apps\api
npx prisma db push
npx prisma generate
cd ..\..
```

Create the first member (after API is running) via:

```powershell
curl -X POST http://localhost:3001/api/admin/members -H "Authorization: Bearer YOUR_ADMIN_JWT" -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"phone\":\"+15555551234\",\"pin\":\"1234\",\"attendanceCode\":\"TEST01\"}"
```

Or use the admin UI after login — **member registration UI** can be added next; for now use the API or Prisma Studio (`npx prisma studio` in `apps/api`).

## Run (two terminals)

**Terminal 1 — API**

```powershell
cd apps\api
npx tsx watch src\index.ts
```

**Terminal 2 — Web** (proxies `/api` to port 3001)

```powershell
cd apps\web
npm run dev
```

Or from repo root: `npm run dev` (runs API + web with `concurrently`).

- Web: http://localhost:5173  
- **Test from a phone on the same Wi‑Fi:** `http://YOUR_PC_IP:5173` — see [docs/OPEN_FOR_TESTING.md](./docs/OPEN_FOR_TESTING.md)  
- **Public HTTPS link for anyone:** [docs/PUBLIC_URL_FREE.md](./docs/PUBLIC_URL_FREE.md) (tunnel to port 5173; PC must stay on)  
- API health: http://localhost:3001/api/health  

**Admin login:** `ADMIN_PASSWORD` from `apps/api/.env` (default in `.env.example` is `change-me` after you copy).

## Production (outline)

- **Render / Railway:** deploy PostgreSQL + `apps/api` (Node `npm run build && npm start`) + static `apps/web` dist or Vite preview behind CDN.  
- Set env vars: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `WEB_ORIGIN` (your site URL).

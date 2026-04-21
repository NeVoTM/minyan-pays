# minyan-pays — local development

## Prerequisites

- **Node.js** 20+ and npm  

## Database

- **Local (fastest):** **SQLite** — `DATABASE_URL="file:./dev.db"` in `apps/api/.env` (see `apps/api/.env.example`). The file is created under `apps/api/prisma/dev.db`. Prisma schema uses `provider = "sqlite"`.
- **Free cloud (recommended for real data):** **Neon PostgreSQL** — step-by-step: [docs/FREE_DATABASE_NEON.md](./docs/FREE_DATABASE_NEON.md). After switching the Prisma `provider` to `postgresql` and setting `DATABASE_URL`, run `npx prisma db push` in `apps/api`.

**Does `npm run dev` or a code update wipe the database?** No. SQLite data stays on disk until you delete the `.db` file, run `prisma migrate reset`, or point `DATABASE_URL` somewhere else. `*.db` is gitignored, so a **fresh git clone** starts with an empty DB until you add members again.

**Why did my members disappear?** See [docs/DATA_AND_BACKUPS.md](./docs/DATA_AND_BACKUPS.md) (resets, new clones, wrong `DATABASE_URL`, backups).

## One-time setup

```powershell
cd C:\Users\17274\minyan-pays
copy apps\api\.env.example apps\api\.env
# Edit apps\api\.env — ADMIN_PASSWORD, JWT_SECRET (SQLite URL is preset)
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

# minyan-pays — local development

## Prerequisites

- **Node.js** 20+ and npm  

## Database (local)

- **Default (easiest):** **SQLite** — no Docker. `DATABASE_URL="file:./dev.db"` in `apps/api/.env` (see `.env.example`).
- **Optional:** **PostgreSQL** — `docker compose up -d postgres` or Neon/Supabase; set `DATABASE_URL` and change `provider` in `apps/api/prisma/schema.prisma` to `postgresql`.

## One-time setup

```powershell
cd C:\Users\17274\synagogue-attendance-software
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
- API health: http://localhost:3001/api/health  

**Admin login:** `ADMIN_PASSWORD` from `apps/api/.env` (default in `.env.example` is `change-me` after you copy).

## Production (outline)

- **Render / Railway:** deploy PostgreSQL + `apps/api` (Node `npm run build && npm start`) + static `apps/web` dist or Vite preview behind CDN.  
- Set env vars: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `WEB_ORIGIN` (your site URL).

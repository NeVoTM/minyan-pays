# Free cloud database (Neon PostgreSQL)

Use a **free Neon** Postgres instance so all minyan-pays data (members, attendance, treasury) is stored in the cloud instead of a local SQLite file. Neon’s free tier is enough for a small shul rollout.

## 1. Create Neon project

1. Open [https://neon.tech](https://neon.tech) and sign up (GitHub or email).
2. **Create a project** (any region close to you).
3. Copy the **connection string** from the dashboard. It looks like:
   `postgresql://USER:PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

Optional: use the **pooled** connection string if Neon shows two URLs (better for serverless / many short connections).

## 2. Point Prisma at PostgreSQL

In `apps/api/prisma/schema.prisma`, set the datasource to Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(If you were on SQLite, remove the old `provider = "sqlite"` / `file:./dev.db` block and use only the block above.)

## 3. Configure the API

In `apps/api/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

Keep your existing `ADMIN_PASSWORD`, `JWT_SECRET`, and `WEB_ORIGIN` values.

## 4. Push schema to Neon

From `apps/api`:

```powershell
npx prisma generate
npx prisma db push
```

This creates all tables on Neon. No Docker required.

## 5. Run the app

From repo root (or two terminals as in `SETUP.md`):

- API loads data from Neon via `DATABASE_URL`.
- Web UI unchanged; it talks to the API only.

## Switching back to local SQLite

Reverse step 2 (`provider = "sqlite"`, `url = "file:./dev.db"`), set `DATABASE_URL` in `.env`, then `npx prisma db push` in `apps/api`.

## Alternatives

- **Supabase** — also free Postgres; same Prisma steps, use their connection string.
- **Railway / Render** — managed Postgres with free tiers that change over time; same `DATABASE_URL` idea.

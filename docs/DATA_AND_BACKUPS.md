# Member data and backups — why rows disappear and how to protect them

## Normal behavior (updates do not delete data)

- SQLite stores the database in a **single file** on disk (see `DATABASE_URL`, usually `file:./dev.db` under `apps/api/prisma/`).
- **Restarting the API**, `npm run dev`, or **deploying new code** does **not** erase that file. Data is only lost if you **delete or replace the file**, **point `DATABASE_URL` to a new path**, or **reset the database**.

## Common reasons data “vanished”

1. **`prisma db push --force-reset`** or **`prisma migrate reset`** — wipes the database and reapplies schema (often used during development).
2. **Deleting `dev.db`** (or the file named in `DATABASE_URL`) manually or by a cleanup script.
3. **A new clone** of the repo — `*.db` is gitignored, so a fresh clone has **no** member rows until you run seed and add people again.
4. **Different machine or folder** — e.g. opening the project from another path or another copy of the repo uses a **different** SQLite file.
5. **Switching `DATABASE_URL`** — e.g. from SQLite to Postgres or a new file path starts empty unless you migrate data.
6. **SQLite on a network/sync folder** — can corrupt or confuse paths; avoid storing DB on cloud-synced folders for production.

## How to protect data (recommended)

1. **Use a managed database** for anything real (Neon, Railway Postgres, etc.): set `DATABASE_URL` in production and run `prisma db push` or migrations once. See `docs/FREE_DATABASE_NEON.md`.
2. **Back up the SQLite file** regularly if you stay on SQLite:
   - Copy `apps/api/prisma/dev.db` (or your configured path) to a safe backup folder or cloud storage with a date in the filename.
3. **Never run `--force-reset`** on a machine that holds production data.
4. **Document** the exact `DATABASE_URL` on each server so deploys don’t point at a wrong file.

## “Lock” the database from tampering

Software updates **cannot** lock a file on disk; protection is **operational**:

- **Secrets**: `JWT_SECRET`, admin/rabbi passwords, `DATABASE_URL` only on the server.
- **Permissions**: only the app user can read/write the DB file.
- **Backups + restore**: keep dated copies before any destructive Prisma command.
- **Audit**: optional admin logs for who approved members or marked payouts (future enhancement).

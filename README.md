# minyan-pays — Dovrey Evrit

Planning and documentation for **minyan attendance**, **first-9 incentives**, **rabbi confirmation**, **treasury-safe payouts**, and payment integrations (PayPal / Zelle / optional USDC per [Copilot sync](./docs/COPILOT-GITHUB-SYNC.md)).

**Synagogue:** **Dovrey Evrit**

**Start here:** [PLAN.md](./PLAN.md) · **Programmer handoff (architecture, schema, API, issues):** [docs/PROGRAMMER_HANDOFF.md](./docs/PROGRAMMER_HANDOFF.md)

**Multiple AI reviewers (Copilot, Gemini, Claude, etc.):** [docs/MULTI_AI_DEVELOPMENT_WORKFLOW.md](./docs/MULTI_AI_DEVELOPMENT_WORKFLOW.md) — lanes, prompts, cadence, safe sharing.

**Mobile:** Web layout is tuned for iPhone-width screens with a bottom navigation bar.

**Database:** Local SQLite by default; free cloud Postgres via [docs/FREE_DATABASE_NEON.md](./docs/FREE_DATABASE_NEON.md).

**Share a free public link (demo):** [docs/PUBLIC_URL_FREE.md](./docs/PUBLIC_URL_FREE.md) — tunnel port 5173 while `npm run dev` runs (`npm run tunnel` or Cloudflare `cloudflared`).

**GitHub Copilot summary + your repo answers:** [docs/COPILOT-GITHUB-SYNC.md](./docs/COPILOT-GITHUB-SYNC.md)

**Next Cursor chat:** [docs/NEXT-CHAT-HANDOFF.md](./docs/NEXT-CHAT-HANDOFF.md)

**Chat archive:** [docs/CHAT-SUMMARY-2026-03-27.md](./docs/CHAT-SUMMARY-2026-03-27.md)

## Application (MVP)

Monorepo:

- **`apps/api`** — Express + Prisma + PostgreSQL (`/api/*`)
- **`apps/web`** — React + Vite + Tailwind (proxies `/api` in dev)

**Run locally:** see [SETUP.md](./SETUP.md) (`docker compose` or hosted Postgres, `npx prisma db push`, `npm run dev`).

## Repository

- **GitHub (private):** `https://github.com/NeVoTM/minyan-pays`  
- **Account:** [NeVoTM](https://github.com/NeVoTM) · elichalfinny@gmail.com  

Local folder on disk may still be named `synagogue-attendance-software`; the **canonical GitHub remote** is **`minyan-pays`** (private).

**Note:** An older public repo `synagogue-attendance-software` may still exist on GitHub from an earlier push; **use `minyan-pays` only** going forward. You can archive or delete the old repo in GitHub settings if you want a single remote.

Commit messages document planning updates.

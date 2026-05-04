# System architecture (minyan-pays)

**Authoritative technical overview:** [docs/PROGRAMMER_HANDOFF.md](./docs/PROGRAMMER_HANDOFF.md)

## Actual stack (summary)

- **Web:** React + Vite + Tailwind (`apps/web`), mobile-first SPA.
- **API:** Node.js + Express (`apps/api`), JSON REST under `/api/*`.
- **Data:** PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`).
- **Deploy (typical):** Render — Node web service + static site + managed Postgres; env vars in `SETUP.md` / `docs/RENDER_DEPLOYMENT.md`.

## Flow (conceptual)

Browser SPA → HTTPS → Express API → Prisma → PostgreSQL.

Admin / rabbi / member sessions use **JWT** bearer tokens and **`X-Organization-Slug`** for tenant scope. Check-in **confirm/reject** is implemented on **rabbi** routes; admin routes for the same action return **403** by design.

---

*The previous content of this file was generic payment-gateway boilerplate and did not describe this repo. Use **PROGRAMMER_HANDOFF** + `schema.prisma` + `apps/api/src/routes/` for accuracy.*

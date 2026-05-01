# Project Status – Where We Left Off

*Last updated: 2026-04-30*

## Current Task / Goal

Ship the 13-item minyan-pays product update: routing defaults, admin/rabbi/member workflows, preferred check-in policy, locations admin UX, schema migration for Render Postgres.

## What's Done

- `/` and unknown routes redirect to `/punch`; admin login has no location dropdown (uses selected org from app or first org by slug); treasurer hint removed from Home/Member menu.
- API: optional `organizationSlug` on `POST /api/auth/admin` with `{ token, organizationSlug }`; member/register/punch copy updated for **admin** approval (not rabbi).
- Rabbi: removed member approval endpoints; added check-in policy (`checkInOnlyPreferred`), `GET/PATCH` rabbi members + preferred flag; punch-in enforces preferred list when policy is on.
- Admin: cannot confirm/reject check-ins (403 + UI); attendance PATCH is times only; `GET/POST /api/admin/organizations`; Locations tab; Add tab shortcuts (member signup, scroll to rabbi form, add-location modal); `refreshOrganizations` on OrgProvider after new location.
- Removed address line 2 from web forms and API member payloads (DB column retained; admin patch clears `addressLine2`).
- Prisma: `Organization.checkInOnlyPreferred`, `User.preferredForCheckIn`, `User.isApproved` default `false`; migration folder `20260430120000_checkin_preferred_policy` added.

## What's Next / Blockers

- **Render:** run `npx prisma migrate deploy` (or `db push`) against production `DATABASE_URL` so new columns exist.
- **i18n:** Non-English locale files still have older rabbi/admin strings; add keys or rely on fallbacks.
- **Home page:** `/` no longer renders `Home.tsx` (only `/punch`); join/register still reachable via bottom nav and `/member`.

## Notes / Context

- Local `prisma migrate dev` was not run (DB unreachable); `prisma generate` and `tsc`/`web build` succeeded.

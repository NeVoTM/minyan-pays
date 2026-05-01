# Project Status – Where We Left Off

*Last updated: 2026-04-30* (iPhone-first rabbi + shell)

## Current Task / Goal

Ship the 13-item minyan-pays product update: routing defaults, admin/rabbi/member workflows, preferred check-in policy, locations admin UX, schema migration for Render Postgres.

## What's Done

- **Member profile (`/member/profile`):** Restructured into stacked `cardShell` sections matching the balance/entry menu (kicker + title + hint). Removed punch-in code (kiosk) UI only; `attendanceCode` still stored and returned by API. Security message + 6-digit field + Send code are one horizontal row (wraps on narrow screens). Dev echo hint when server returns `devCode`.
- `/` and unknown routes redirect to `/punch`; admin login has no location dropdown (uses selected org from app or first org by slug); treasurer hint removed from Home/Member menu.
- API: optional `organizationSlug` on `POST /api/auth/admin` with `{ token, organizationSlug }`; member/register/punch copy updated for **admin** approval (not rabbi).
- Rabbi: removed member approval endpoints; added check-in policy (`checkInOnlyPreferred`), `GET/PATCH` rabbi members + preferred flag; punch-in enforces preferred list when policy is on.
- Admin: cannot confirm/reject check-ins (403 + UI); attendance PATCH is times only; `GET/POST /api/admin/organizations`; Locations tab; Add tab shortcuts (member signup, scroll to rabbi form, add-location modal); `refreshOrganizations` on OrgProvider after new location.
- Removed address line 2 from web forms and API member payloads (DB column retained; admin patch clears `addressLine2`).
- Prisma: `Organization.checkInOnlyPreferred`, `User.preferredForCheckIn`, `User.isApproved` default `false`; migration folder `20260430120000_checkin_preferred_policy` added.
- **Member signup:** PIN (4 digits, masked) beside mobile on one row (`items-end`, phone `flex-1` for full 10-digit width); email on full-width next row; label **PIN 4 Digits** (`whitespace-nowrap`). City / state / ZIP and both Zelle fields use **3- and 2-column grids on all breakpoints** so iPhone matches desktop row layout. Earlier: removed married checkbox; register sends `pin`.
- **iPhone-first shell:** `App` root + main use `overflow-x-hidden`, tighter horizontal padding, `min-w-0` where needed. Bottom **MobileNav**: distinct colors per tab (punch emerald/teal, member violet, rabbi amber). **Punch / Member menu:** single-column CTAs below 360px width, then two columns.
- **Rabbi dashboard:** Header stacks on narrow screens; full-width rose **Log out**; tab buttons each have their own color (emerald / violet / amber / sky). Today’s check-ins show **address** + **check-in time** (org timezone); **View / edit member** opens a modal; **Confirm** / **Reject** full-width with distinct colors. Payouts use a **scrollable card list** instead of a wide table. **API:** `GET/PATCH /api/rabbi/members/:id` (approved members only; no `isApproved` change); `session/today` includes `timezone` and member address fields; `rabbiMemberUpdateSchema` in `memberSchemas`.
- **Admin dashboard:** Home + logout row stacks on small screens (matches rabbi). **`phoneDigitsFromE164`** moved to `lib/phoneDisplay.ts` (shared with admin + rabbi).

## What's Next / Blockers

- **Render:** run `npx prisma migrate deploy` (or `db push`) against production `DATABASE_URL` so new columns exist.
- **i18n:** es/fr/ru `rabbi` blocks expanded to match current UI strings; Hebrew rabbi banner/export keys added.
- **Home page:** `/` no longer renders `Home.tsx` (only `/punch`); join/register still reachable via bottom nav and `/member`.
- **Deploy:** Redeploy static site after build so production signup picks up UI changes.

## Notes / Context

- **Profile SMS verification:** `POST /api/me/profile/verification/send` generates a code and stores it; SMS is not wired to Twilio yet — server logs `[SMS-VERIFY] send to {phone}: {code}`. In production, JSON may omit `devCode` unless `MEMBER_VERIFICATION_ECHO_CODE=1`. Real texts to 305-905-5068 require an SMS provider + env config.
- Local `prisma migrate dev` was not run (DB unreachable); `prisma generate` and `tsc`/`web build` succeeded.
- **2026-04-30:** Deploy **API** when using rabbi member edit — new routes and `session/today` shape. Web deploy for UI.
- **SPA on Render:** Direct URLs like `/admin` returned plain “Not Found” because the static host had no `404.html`. The web **build** now copies `index.html` → `dist/404.html` (`apps/web/scripts/spa-render-404.mjs`). Redeploy the static site so production picks this up.

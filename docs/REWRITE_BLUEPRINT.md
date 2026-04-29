# Minyan-Pays Rewrite Blueprint (Alpha -> Beta)

Date: 2026-04-22

## Goal

Build a clean Beta rewrite from the ground up, keep approved behavior, remove duplicate/legacy code, and end with one clear folder/file structure.

## What This Is Called

This effort is typically called a:
- Rewrite Blueprint
- Functional Specification
- Technical Design Specification
- Migration and Cutover Plan

This file combines all of them as the execution baseline.

## Must-Keep Product Scope

### Roles
- Admin
- Rabbi
- Member

### Member flow
- Create account
- Check-in
- Check-out
- View balance / payout due

### Rabbi flow
- Approve pending members
- Confirm/reject check-ins
- Mark payouts paid and save
- Manage banner
- Export weekly CSV

### Admin flow
- Location setup
- Rabbi setup
- Member oversight and controls

## Non-Negotiable Functional Parity

Before old code is removed, Beta must preserve:
- Phone + PIN check-in/out flow
- Location dropdown with location name + address
- Check-out defaulting to the location linked to active check-in
- One location can have multiple rabbis
- Role boundaries (Admin/Rabbi/Member)

## Data Model Requirements

- `Organization`: location identity/default settings
- `Rabbi`: linked to organization (one-to-many)
- `User`: member identity and payment profile
- `Attendance`: check-in/out record lifecycle
- `WeeklyPayout`: weekly payout tracking

Key constraints:
- Unique IDs for attendance/payment records
- Check-out must link to existing open check-in
- No ambiguous role ownership of actions

## UI/UX Requirements

- Footer labels uppercase
- Check-in style: large, bold, green
- Check-out style: large, bold, red
- Mobile-condensed forms where possible
- US phone mask default (`123-456-7890`) with international support

## Modern UI Inspiration (HaYom Pattern Mapping)

Reference inspiration: [HaYom](https://hayom.app/)

Carry these interaction patterns into Beta while preserving existing minyan functionality:

- **Header utility rail:** top row with compact icon actions (progress, calendar/date, profile/settings) and a small contextual date label. Keep this lightweight and always visible on mobile.
- **Focused onboarding modal:** first-run flow in a centered modal with dimmed background, one primary CTA, and a secondary "already have account" path.
- **Card-toggle selection step:** onboarding step where users toggle learning/attendance preferences via selectable cards with clear checked state and short helper copy.
- **Quick action banners:** slim announcement/action chips near the top (for example, location setup, pending approvals, or payout reminders) with one-tap completion.
- **Strong empty states:** when no attendance/progress data exists, show a simple icon, one-line explanation, and one clear primary button (avoid dense placeholders).
- **Language toggle prominence:** show Hebrew/English switch as an obvious first-class control in onboarding and settings.
- **Soft neutral surfaces + warm CTA:** use a calm background and high-contrast warm primary button to keep actions obvious without a noisy interface.

Suggested button system for minyan-pays rewrite:

- **Primary CTA:** rounded rectangle, medium-high contrast, used for "Check in", "Start", "Save", "Approve", "Mark Paid".
- **Secondary CTA:** outlined/low-emphasis button for "Back", "Cancel", "Not now".
- **Tertiary text action:** inline action links for "Already have account?", "Edit details", "Learn more".
- **Card action buttons:** small in-card actions ("Customize", "Options") for progressive disclosure instead of long forms.

Functional adoption ideas by role:

- **Member:** onboarding wizard (welcome -> language -> phone/PIN -> first check-in), then a cleaner home with one dominant check-in/check-out action.
- **Rabbi:** dashboard chips for pending check-ins and pending payouts, with compact cards for approve/reject/mark-paid actions.
- **Admin:** setup banners for location/rabbi completeness, with one-click jump into missing configuration steps.

## Architecture Rules for Beta

- No duplicate route responsibilities
- Shared components for repeated UI patterns
- Keep route -> service -> data access boundaries clear
- Keep state minimal and predictable
- Add tests for role permissions and attendance lifecycle

## Target Architecture and Systems (Planned for Post-Alpha Rollout)

This is the target stack we will use for production-grade infrastructure.
We will finalize behavior first in Alpha rewrite code, then implement this infrastructure layer after Alpha reaches near-feature-complete parity.

### Application Stack

- **Web app:** React + TypeScript + Vite
- **Routing:** React Router (role-aware route groups)
- **UI system:** shared component library (buttons, cards, banners, empty states, modal flow)
- **API:** Node.js + TypeScript service layer
- **ORM/data access:** Prisma
- **Database target:** PostgreSQL (managed service in production)
- **Local/dev database:** SQLite allowed during rapid rewrite phase

### Data and Domain Boundaries

- **API domains:** `auth`, `punch`, `member`, `rabbi`, `admin`, `reporting`
- **Server layering rule:** route handler -> domain service -> repository/data access
- **Permission model:** server-enforced RBAC for Admin/Rabbi/Member on every protected endpoint
- **Audit model:** attendance edits, payout changes, approvals, and deletes must be logged

### Offline/Online Multi-Location Data Strategy

Goal: each location can continue working during bad/no internet, then safely sync when connection returns.

- **Local-first write path:** punch-in, punch-out, and local queue writes must work offline.
- **Sync queue model:** all offline writes are stored as append-only sync events with:
  - client event ID (UUID)
  - location ID
  - actor ID/role
  - event type (`attendance.punch_in`, `attendance.punch_out`, etc.)
  - event timestamp (device + server reconciliation fields)
- **Idempotent server ingest:** API accepts duplicate retries and resolves by client event ID (no double punch from retry).
- **Conflict policy:** attendance event history is append-only; server computes current state from event stream + guard rules.
- **Location partitioning:** each record/event is scoped to location, so one location's connectivity issues do not block others.
- **Sync feedback in UI:** show `Offline`, `Syncing`, `Synced`, and `Sync errors` badges per device/session.
- **Background recovery:** automatic sync on reconnect plus manual "Retry sync" action in admin/rabbi utilities.

### Database Cost Strategy (Low Data Volume)

Because minyan-pays stores relatively small operational data, cost control is a first-class requirement:

- **Phase A (alpha and pilot):** SQLite/local dev + small managed Postgres free tier for shared testing.
- **Phase B (beta production):** low-cost managed Postgres tier with daily backups and modest retention.
- **Data retention policy:** archive/export old attendance snapshots if table growth becomes unnecessary for active ops.
- **Avoid heavy cost drivers:** no unnecessary blob storage, no over-retained logs, no always-on high-tier compute.
- **Scale trigger:** only upgrade DB tier after measurable thresholds (storage, concurrent usage, latency, backup window).

### Security Baseline

- PIN/password hashing for all credential material (never plaintext)
- Request validation on all write endpoints
- Rate limits and basic abuse protection on auth and punch endpoints
- Strict CORS + secure cookie/session settings
- No secrets in frontend bundles; environment variables only on server
- Weekly payout and attendance changes must remain traceable (who, what, when)

### Source Protection and Copy-Limiting Strategy

Important reality: a public web frontend cannot be made impossible to copy. We can, however, strongly limit useful copying and protect core IP.

- **Keep core logic server-side:** payout rules, approval rules, fraud/guard checks, and reporting logic stay in API services, not in browser code.
- **Private source control:** repository remains private; role-based access; branch protections; no production secrets in git.
- **Legal protection:** add explicit proprietary license and Terms of Use (`no reverse engineering`, `no unauthorized scraping/reuse`), plus contractor IP assignment terms.
- **Harden client distribution:** minified production bundles, source maps disabled in production by default, and build metadata stripped where possible.
- **API protection:** authenticated endpoints, scoped tokens/sessions, per-location permission checks, rate limiting, and WAF/bot filtering on public endpoints.
- **Data export control:** watermark sensitive exports/reports (location + timestamp), and log who exported what and when.
- **Monitoring and enforcement:** detect abnormal scraping/access patterns and support takedown process for copied branded assets/content.

Implementation policy for minyan-pays:

- **Alpha phase:** design features and keep sensitive business logic off the client from day one.
- **Post-alpha infrastructure phase:** apply WAF/rate-limit/enforcement controls and production legal/terms package before broad rollout.

### Quality and Delivery Systems

- **Testing:** role-permission tests, attendance lifecycle tests, payout integrity tests
- **CI checks:** lint, typecheck, test, build
- **Migrations:** Prisma migrations with rollback-safe process
- **Backups:** scheduled DB backups before cutover and before destructive schema changes
- **Observability (phase after Alpha):** error logging + request logs + basic health checks

### Infrastructure Timing Decision

- **Now (Alpha rewrite):** prioritize feature parity and clean architecture in code.
- **After Alpha is near-complete:** implement hosting, production DB, backups, monitoring, and security hardening controls.
- **Cutover gate:** infrastructure rollout starts only after parity checklist is substantially complete and critical flows pass end-to-end.

## Phased Rewrite Plan

1. Freeze requirements (this file + handoff docs).
2. Lock target folder structure and naming standards.
3. Rebuild API by domain (auth, punch, admin, rabbi, member).
4. Rebuild web by role flow using shared components.
5. Add migration/compatibility scripts.
6. Run parity and regression checklist.
7. Cut over to Beta branch/release.
8. Archive/delete old code only after full pass.

## Clean Cutover Rule

Old folders/files are removed only when all are true:
- Feature parity checklist passes
- Seed/dev scripts validated
- End-to-end role workflows pass
- Backup tag/branch created

## Day 1 Starting Point (Tomorrow)

1. Read `docs/HANDOFF_NEXT_SESSION.md` and this blueprint.
2. Create branch: `rewrite/beta-foundation`.
3. Lock architecture decisions (folder map + API layering + validation strategy).
4. Build first vertical slice end-to-end:
   - Member check-in/check-out with linked location default
5. Add tests for that slice.
6. Continue Rabbi/Admin slices after that baseline passes.

## Deliverables for Rewrite Kickoff

- `docs/REWRITE_BLUEPRINT.md` (this file)
- Updated handoff docs
- API parity checklist
- UI parity checklist
- Migration and cutover checklist

# Handoff Summary (Admin / Rabbi / Member)

Date: 2026-04-20

## Latest Session Updates (2026-04-22)

### Punch location linking (new)
- Added location dropdown on check-in and check-out forms using location name + address.
- Dropdown options come from organization list (`synagogueName` + `locationAddress`).
- Check-out now auto-defaults to the member's active check-in location via:
  - `POST /api/punch/out-location-default`
- Check-out submit now includes linked location and can resolve location automatically when needed.
- API now supports optional explicit org override per request from web client.

### Database/setup status
- Ran Prisma sync and seed path:
  - `npx prisma db push`
  - `npm run db:seed`
- Current seed status message: organizations already exist (no reseed needed).

### Auth and role access
- Rabbi login no longer falls back to admin password.
- Rabbi menu access now requires Rabbi setup (`rabbiPasswordHash`) per location.
- If Rabbi setup is missing, Rabbi login returns explicit setup-required error.

### Admin menu restructuring
- Restored **Overview** tab and kept **Location setup** + **Rabbi setup** in Admin.
- Removed Admin treasury block UI and related frontend code paths.
- Removed Admin approvals and check-in/out tabs from active navigation flow.
- Admin **Add member** now routes to the same Join/Register signup flow (`/member/signup`) instead of duplicate inline form.

### Rabbi menu expansion
- Moved treasury/export capability into Rabbi API surface:
  - `GET /api/rabbi/treasury`
  - `POST /api/rabbi/treasury/fund`
  - `PATCH /api/rabbi/treasury/lock`
  - `GET /api/rabbi/export/week/:weekKey.csv`
- Banner save/edit remains in Rabbi menu.

### Punch-in / punch-out flow simplification
- Removed punch-in code + smart code/QR from active check-in/out flow.
- Check-in/out now use **phone + 4-digit PIN** only.
- UI condensed to one-row identity entry on punch screens.
- Updated punch-out subtitle text to:
  - "After the Rabbi confirms your punch-in, record punch-out."
- Default phone placeholder set to US format (`123-456-7890`), with international-entry helper prompt shown when digits exceed 10.

### Navigation and labeling updates
- Bottom nav labels forced to uppercase styling.
- Check-in menu color set to green; check-out menu color set to red.
- Added **Member Balance** menu item and moved sign-in access there.
- Join/Register page simplified (removed extra intro/helper text).

### Member balance screen updates
- Member login inputs condensed to one row (phone + PIN).
- Removed "New here? Create an account" prompt from member balance menu.

### Data model updates
- `Organization` expanded with location/rabbi profile fields:
  - `locationAddress`, `locationPhone`, `locationEmail`, `locationWebsite`
  - `rabbiName`, `rabbiAddress`, `rabbiPhone`, `rabbiEmail`

### Build and runtime status
- Full workspace build currently passes (`api` + `web`).
- Dev server currently runs with Vite auto-fallback when `5173` is occupied (typically on `5174`).

## What Was Added/Changed

### Data safety and continuity
- Added `docs/DATA_AND_BACKUPS.md` with guidance on why member data can appear "deleted" (wrong DB file, reset volume, new clone, changed `DATABASE_URL`, reset/migration in dev).
- Added setup guidance link from `SETUP.md` so backup and persistence rules are visible during onboarding.

### Multi-location and organization defaults
- Organization-aware flow expanded across API and web.
- Public org endpoints and org-aware config are used to render location-specific name/banner/default locale.
- Default location behavior improved:
  - Auto-select when exactly one location exists.
  - Clear invalid saved location if it no longer exists.

### 3-tier hierarchy implemented
- Tier 1: **Admin**
- Tier 2: **Rabbi**
- Tier 3: **Member**

### Admin menu and functions
- Admin dashboard tabbed structure expanded and refined:
  - Overview
  - Approvals (pending registrations)
  - Members
  - Today's check-ins
  - Add member
  - Check-in/out transaction list
- Added **Location setup** in admin overview:
  - Set location display name (`synagogueName`)
  - Set location default language (`defaultLocale`)
- Added **Rabbi setup** in admin overview:
  - Set/clear Rabbi password for the current location (`rabbiPasswordHash` via admin settings route)
- Existing admin controls remain:
  - Treasury lock/fund
  - Banner save
  - Weekly export
  - Member CRUD and attendance transaction controls

### Rabbi menu and functions
- Added Rabbi auth and Rabbi-only dashboard routes.
- Rabbi dashboard supports:
  - Approve pending members
  - Confirm/reject today's check-ins
  - Weekly payouts with paid markers
  - Bulk actions: select all with earnings, select by date, clear, save

### Member flow and UX alignment
- Member-facing flow kept focused:
  - Create account
  - Edit/view details
  - Punch in
  - Punch out
  - View payment due
- Signup location naming updated to follow admin-configured location name.

### Navigation updates
- Removed "Switch location" action from the main header.
- Removed admin login link from signup/home card area.
- Added Rabbi item into footer/mobile nav with other menu items.
- Language control upgraded from toggle to dropdown list.

### Localization
- New strings added for admin approvals, rabbi menus, and home/staff links.
- Locale parity updated across English, Hebrew, Spanish, French, and Russian for relevant new keys.

## Files/Areas Touched (high-level)
- API:
  - auth middleware and auth routes
  - admin routes
  - rabbi routes
  - public routes
  - schema updates (organization-level rabbi password hash)
- Web:
  - app routing and org context
  - admin dashboard
  - rabbi login/dashboard pages
  - home, signup, nav, language controls
  - locale files
- Docs:
  - data safety/backup guide
  - setup linkage

## Current Known Discussion Items / Pending Decisions

### Event menu (next session)
- Add a new **Event menu** feature and define:
  - who can create/edit events (Admin, Rabbi, or both)
  - attendee/member event sign-up and check-in behavior
  - whether event attendance affects payouts or reports
  - event calendar/list UX and required fields (date/time/location/capacity/notes)

### Wife-focused program track (new campaign direction)
Requested concept:
- Engage wives as primary payout recipients/influence path to increase husband attendance.
- Support both married and non-married members.

Proposed scope for next session:
1. Add **Wife profile** model/fields (identity + payment preference + consent/contact flags).
2. Add **Wife payout destination policy**:
   - default payout destination when married
   - override rules per member/week
3. Add **Wife portal/menu** (or wife sub-menu under Member) for:
   - view expected/confirmed payouts
   - payout method preferences
   - attendance-linked payout history
4. Add rabbi/admin controls for wife payout approval and audit trail.
5. Decide privacy and consent rules:
   - what wife can see
   - notification policy
   - legal text for payout authorization.

## Recommended Next Steps (tomorrow)
1. Finalize functional spec for wife flow (menu placement, auth model, payout ownership rules).
2. Implement delete guard rule requested for Rabbi:
   - delete only if no payment due and no attendance/check-in history.
3. Add cross-location Admin supervisory view:
   - per-rabbi members
   - per-rabbi attendance
   - per-rabbi payout status.
4. Add targeted tests for new setup flows and role permissions.
5. Add full locale parity for newly added punch location strings.

## Next Chat Discussion List
- [ ] Event menu scope (roles, lifecycle, and attendee workflow).
- [ ] Wife-focused flow v1 (menu placement, auth path, payout visibility).
- [ ] Rabbi member-delete guard rule (no payment due + no attendance history).
- [ ] Admin cross-location supervision screen (per-rabbi members/check-ins/payouts).
- [ ] Notification policy (member/wife/rabbi/admin: approvals, payouts, attendance).


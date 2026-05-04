# Minyan-Pays Program Summary

> **For programmers:** Use **[PROGRAMMER_HANDOFF.md](./PROGRAMMER_HANDOFF.md)** for accurate architecture, **PostgreSQL/Prisma schema**, **real API routes**, deployment, and known issues. This file is product narrative and historical notes; some bullets below still mention SQLite or `AppSettings` — the live schema is **`apps/api/prisma/schema.prisma`** (PostgreSQL only; banner/settings live on **Organization**).

## Overview

`minyan-pays` is a mobile-first web app for synagogue attendance tracking and payout management at Dovrey Evrit. It supports daily minyan operations (punch-in/punch-out), rabbi/admin verification workflows, and weekly payout tracking with member-facing transparency.

## Core Attendance Features

The app records attendance in a controlled sequence: member/public punch-in, rabbi confirmation, and punch-out. This flow reduces false attendance claims and provides auditable timestamps for each service day.

## Admin Capabilities

The admin area includes member management (add, view, edit, approve, delete), attendance confirmation/rejection, treasury funding/lock controls, payout export, and settings management. Admins can also set a synagogue-wide "Message from the Rabbi" banner shown across screens.

## Member Capabilities

Members can register, sign in, view their attendance and estimated weekly earnings, and punch out from their dashboard. A dedicated Billing page summarizes payout destinations such as Zelle and PayPal, with room for additional methods as the product expands.

## Registration and Contact Data

Signup captures first/last name, phone, PIN, attendance code, email, address, city/state/ZIP, and optional payout numbers. Address lines are constrained for clean data quality, phone input uses consistent 3-3-4 formatting, and terms acceptance is required.

## Billing and Payout Setup

Billing currently focuses on payout-linked contact channels: member Zelle number, spouse/alternate Zelle number, and PayPal account details. The screen is intentionally structured to add more payout options in future releases without redesigning the flow.

## ZIP Code Automation

ZIP lookup auto-fills city and state during signup. The API caches ZIP responses in the database (`ZipCache`) to improve speed, reduce repeated external calls, and preserve reliable behavior even when external ZIP services are slow.

## Reliability and Error Handling

The web client includes clearer service-unavailable messaging for proxy/API issues (e.g., HTTP 502/503) and startup guidance. A desktop launcher script is included so non-technical users can reliably start both API and web services together.

## Data and Storage

Storage is **PostgreSQL** via Prisma (local Docker, Neon, or Render). Key models include `Organization`, `User`, `Attendance`, `MinyanSession`, `WeeklyPayout`, `Treasury`, `MemberLedgerEntry`, `ZipCache`, and related tables — see `schema.prisma`.

## API Surface (High Level)

Major route groups include auth, member data, admin operations, attendance/punch flows, registration, and public utility/config endpoints. Public endpoints currently include config delivery (`/api/public/config`) and ZIP lookup (`/api/public/zip/:zip`).

## Design Language and UI Style

The current UI uses a modern mobile style inspired by contemporary account/settings experiences: light neutral background, white elevated cards, pill inputs, rounded navigation, and blue gradient primary actions. The visual direction is aligned with modern mobile reference patterns such as Dribbble account-settings layouts.

## Security and Access Model

Admin and member areas are token-protected. Members require approval before full access, and sensitive operations (attendance confirmations, treasury actions, exports, and settings) are limited to admin-authenticated sessions.

## Current Limitations

Billing currently displays payout methods but does not yet provide full self-service editing for all payment channels. Styling has been substantially modernized, but parts of deep admin workflows can still be polished further for full consistency.

## April 2026 Update Details

Recent work added and clarified the following behavior across admin, member signup, and attendance flows.

- Admin menu is now organized as a 2x2 section grid (Overview, All members, Today's check-ins, Add member) so more data fits on screen.
- All members view supports direct View, Edit/Save, Delete, and Approve actions.
- Today's check-ins dashboard includes Confirm/Reject for pending punch-ins and member-level View/Edit/Delete controls.
- Admin now surfaces pending approvals with a pulsing notice and tab label count.
- View-member modal now includes action buttons (Edit/Save, Delete, Close), lighter backdrop, and improved row-based layout.
- Member "since" date is shown in the modal header; key/value rows are aligned for easier scanning.
- Address in view modal is compressed to one line for density, with full content available in tooltip/title.
- Success flash messages are reset when switching admin sections to avoid stale status text.

### Registration and Code Handling

- Member registration supports optional punch-in code entry; if omitted, the server auto-assigns a unique code.
- Duplicate punch-in code errors are converted to clear user-facing messages (instead of raw Prisma errors).
- Signup and admin labels were clarified: "Punch-in code" (kiosk flow) vs "Login PIN" (phone login flow).
- Client-side and server-side duplicate punch-in code checks prevent conflicting codes and highlight invalid fields in red.

### PIN and Authentication Clarification

- Member sign-in remains phone + PIN.
- PIN is stored as a bcrypt hash and is not displayed in admin view.
- Admin view explicitly states PIN is encrypted and can only be changed via edit.
- Edit-member flow allows PIN updates, with validation for minimum length before save.
- PIN is not a global unique value by itself; phone identity plus PIN verification controls login.

### Punch-In / Punch-Out Validation

- Public punch-out now requires either a full 10-digit phone or a real two-word name (first + last) after normalization.
- Trailing-space or partial-name cases no longer incorrectly pass name validation.
- Punch-in screen/help text now consistently references punch-in code terminology.

### Local Dev, Data Persistence, and Testing Notes

- Desktop launcher script was improved to validate path, print database location, open browser, and start both API+web.
- Local dev database is SQLite at `apps/api/prisma/dev.db`.
- Normal app restarts and code edits do not wipe DB data.
- Data loss only occurs with explicit reset/delete actions, changed `DATABASE_URL`, or fresh clone without copied `.db`.

## Rewrite-Ready Functional Specification

This section is intended as the authoritative baseline for future rewrites/redesigns so functionality remains equivalent.

### Admin Information Architecture

- Admin home is sectioned into: Overview, All members, Today's check-ins, Add member, and Check-in/out.
- Pending approvals must remain prominent (count in navigation + visual notice).
- Modal overlays must preserve readability of controls (lighter backdrop and high-contrast text actions).

### Member Identity and Credentials

- Member login uses phone + login PIN.
- Login PIN is stored as a hash and must never be displayed in plaintext to admin.
- Admin can change PIN via edit flow (minimum length enforced).
- PIN is not required to be globally unique.

### Punch-In Code Behavior

- Punch-in code is distinct from login PIN and used for punch-in flow.
- Punch-in code must be unique across members.
- Duplicate punch-in code must be blocked in API and UI with user-facing guidance and red field feedback.

### Attendance Transaction Rules

- Attendance records are persisted in database and must be fully auditable.
- Admin must be able to list historical transactions (check-in/check-out), edit, save, and delete records.
- Editable transaction fields include punch-in datetime, punch-out datetime (nullable), and punch-in status.
- Confirmed status tracks confirmation timestamp semantics; pending can clear confirmation timestamp.

### Public Punch-Out Validation

- Public punch-out accepts either:
  - a valid 10-digit phone, or
  - a two-word normalized full name (first + last).
- Partial or malformed single-name inputs must be rejected.

### UX and Data Presentation Constraints

- View-member details are row-oriented (label left, value right) for dense scanning.
- Address is condensed to one-line display for compactness, with full value available via tooltip/title.
- View-member screen includes direct action controls (edit/save/delete/close).

## Near-Term Roadmap

Top next steps include extending billing/settings edit flows, adding additional payout options, continuing visual refinement in admin-heavy screens, and adding focused tests for auth, public config, ZIP lookup, and payout-critical paths.

## Run and Access

Start locally from `C:\Users\17274\minyan-pays` with `npm run dev` (or desktop launcher). Default local URLs are web `http://localhost:5173` and API `http://localhost:3001`.

## Git and continuity

- **Developer / contractor brief:** `docs/PROGRAMMER_HANDOFF.md`
- Primary handoff for the next Cursor session: `docs/NEXT-CHAT-HANDOFF.md`.
- After pulling on another machine, run `npm install` if dependencies changed, then `npm run dev` from repo root.

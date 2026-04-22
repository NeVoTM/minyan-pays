# Handoff for next chat — minyan-pays (Dovrey Evrit)

**Last updated:** 2026-04-22  
**Synagogue:** **Dovrey Evrit**  
**GitHub account email:** elichalfinny@gmail.com  
**GitHub username:** [NeVoTM](https://github.com/NeVoTM)  
**Repository:** **`minyan-pays`** (private) → https://github.com/NeVoTM/minyan-pays

Use this file so a new session can continue immediately.  
For full, current detail of the latest iteration, read: `docs/HANDOFF_NEXT_SESSION.md`.

**When you return:** Open this file, run `git pull` on `main`, then continue from `docs/HANDOFF_NEXT_SESSION.md` (latest source of truth).

---

## Snapshot of latest changes (2026-04-22)

- Rabbi login hardened: no admin-password fallback; Rabbi setup required.
- Admin menu reset to keep **Overview** with **Location setup** + **Rabbi setup** visible.
- Admin treasury block removed from UI/code.
- Rabbi menu now owns treasury/export actions (API routes added under `/api/rabbi/...`).
- Punch flow simplified to **phone + PIN** only (code/QR removed from active flow).
- Navigation/style polish:
  - uppercase menu labels
  - green check-in / red check-out nav coloring
  - Member Balance menu introduced; sign-in moved there.
- Member login layout condensed to one-row phone+PIN.
- Organization schema expanded for location + rabbi profile/contact fields.

---

## Current codebase location

- Primary local repo: `C:\Users\17274\minyan-pays`
- Legacy clone also exists: `C:\Users\17274\synagogue-attendance-software` (older path name)

---

## What is implemented now

### Product flow
- Public/member flow supports:
  - Punch in (`/punch`)
  - Punch out (`/punch/out`)
  - Member login (`/member`) and dashboard (`/member/app`)
  - Member signup (`/member/signup`)
- Admin flow supports:
  - Admin login (`/admin`)
  - Admin dashboard (`/admin/app`) with member CRUD, approvals, treasury tools, export
  - Sectioned admin UI: Overview, All members, Today’s check-ins, Add member, **Check-in/out**
  - **Check-in/out:** list/edit/delete `Attendance` rows (`GET|PATCH|DELETE /api/admin/attendance[...]`)
  - Pending-approval banner + tab hint counts

### Data model updates (Prisma)
- `User` includes contact + payout fields (email, spouse info, PayPal, ACH).
- `AppSettings` now includes `rabbiBanner`.
- New `ZipCache` model for ZIP → city/state cache.

### Public endpoints added
- `GET /api/public/config` → synagogue name + rabbi banner
- `GET /api/public/zip/:zip` → ZIP lookup (cached + API fallback)

### UX and reliability updates
- Better API error hints for 502/503 and connection failures in `apps/web/src/api.ts`.
- Desktop dev launcher created:
  - `C:\Users\17274\Desktop\Start minyan-pays dev.bat`
- `SETUP.md` notes SQLite is not wiped on normal restarts; `.db` is gitignored.
- **Program writeup:** `docs/PROGRAM-SUMMARY.md` — stakeholder summary plus **Rewrite-Ready Functional Specification** for future redesigns.
- Registration: optional punch-in code with server auto-assign; duplicate-code friendly errors.
- Public punch-out: two-word name or 10-digit phone validation tightened (client + API).
- Admin: punch-in code vs login PIN labeling; duplicate punch-in code checks; view-member modal actions and layout.

### New API (admin attendance ledger)
- `GET /api/admin/attendance` — list recent attendance transactions (member + session + timestamps + status).
- `PATCH /api/admin/attendance/:id` — edit punch-in/out times and status.
- `DELETE /api/admin/attendance/:id` — remove a transaction.

### New library
- `apps/api/src/lib/attendanceCode.ts` — unique punch-in code generation for registration when omitted.

### Signup enhancements
- Terms checkbox
- Email field
- 3-3-4 phone formatting for phone + Zelle inputs
- Address limits and better scrolling behavior
- ZIP lookup autofill for city/state
- Global clock in header and Rabbi message banner across pages.

---

## Modern UI refresh (latest)

A major style pass was completed to mimic modern Dribbble-style mobile account screens:
- Light neutral background (`#f3f4f6`)
- White rounded cards with soft shadows
- Blue gradient primary CTAs
- Pill-style inputs and cleaner spacing
- Updated mobile nav and app shell
- New Billing screen: `/member/billing`

### New/important web files
- `apps/web/src/lib/uiClasses.ts`
- `apps/web/src/components/BackLink.tsx`
- `apps/web/src/components/MobileNav.tsx`
- `apps/web/src/components/RabbiBanner.tsx`
- `apps/web/src/components/ClockBar.tsx`
- `apps/web/src/pages/MemberBilling.tsx`

---

## Environment and run

From `C:\Users\17274\minyan-pays`:

```powershell
npm run dev
```

Expected:
- Web: `http://localhost:5173`
- API: `http://localhost:3001`

If browser shows connection refused or HTTP 502, ensure both services are running from root (`npm run dev`) or use the desktop `.bat` launcher.

---

## Git remotes

- `origin`: `https://github.com/NeVoTM/minyan-pays.git`
- `cur`: `https://github.com/NeVoTM/minyan-pays-cur.git`

---

## Next priorities

1. Continue modern styling pass on remaining admin screens for full visual consistency.
2. Expand Billing with editable payment methods and future payout options.
3. Add account/settings editing screens similar to reference mockups.
4. Add tests for ZIP lookup + public config + key auth flows.

---

## Next session prompt

**“Continue minyan-pays from `C:\Users\17274\minyan-pays\docs\NEXT-CHAT-HANDOFF.md` — pull latest `main`, then continue admin polish, billing, or tests as listed in Next priorities.”**

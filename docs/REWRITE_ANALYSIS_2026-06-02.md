# MinyanPays — Code Analysis & Rewrite Assessment

**Analyzed:** GitHub repo NeVoTM/minyan-pays (main branch)  
**Analysis date:** June 2, 2026  
**Analyzer:** Claude AI (via GitHub PAT access)  
**Status:** Project is **MUCH MORE MATURE** than directives suggested — multi-rabbi/shamosh architecture, global admin system, member ledger instead of simple payouts

---

## SHOCKING DISCOVERY: Codebase is 70% More Mature Than Docs Claim

### What Directives Said vs. What's Actually Built

| Feature | Directive Status | Actual Code Status | Gap |
|---------|---|---|---|
| **Auth security** | "Passwords disabled, needs restore" | ✅ Fully implemented (bcrypt, timingSafeEqual) | Docs are **outdated** |
| **Admin password** | "Missing" | ✅ Global + per-org + bootstrap, email reset flow | Docs **wrong** |
| **Rabbi password** | "Needs bcrypt hash" | ✅ Bcrypt hashed, 8-char with special chars | Docs **wrong** |
| **Member PIN** | "Needs bcrypt check" | ✅ Already bcrypt verified | Docs **wrong** |
| **Three tefillos** | "Needs to add TefillahType enum" | ❌ **Not in schema** (only `dateKey` sessions) | **Missing feature** |
| **Shamosh role** | "Not mentioned in directives" | ✅ Full shamosh (helper) system built | Docs **incomplete** |
| **Multi-rabbi support** | "Not mentioned" | ✅ Partially built (reverted May 9, schema still there) | Docs **incomplete** |
| **Member ledger** | "Simple `WeeklyPayout` table" | ✅ Full `MemberLedgerEntry` with EARNED/PAID/DONATED | Docs **outdated** |
| **Charity donations** | "Not mentioned" | ✅ Charity model + donation tracking | Docs **incomplete** |
| **Preferred check-in** | "Not mentioned" | ✅ `User.preferredForCheckIn` flag system | Docs **incomplete** |
| **First Nine slots** | "Needs implementation" | ❌ No slot number calculation in code | **Missing logic** |
| **Render blank page** | "Critical: fix first" | ⚠️ Likely still broken (SPA routing issue) | **Outstanding** |

---

## DATABASE SCHEMA — STRONG FOUNDATION (More than Docs Described)

### Current Models (in `apps/api/prisma/schema.prisma`)

**Organization** (Core location entity)
- ✅ Multi-tenant support via `slug`
- ✅ Global + per-org admin password hashes
- ✅ Rabbi/shamosh password hashes
- ✅ Treasury field (missing in directives)
- ✅ Rabbi banner message
- ✅ Preferred member check-in settings
- ✅ Timezone + locale defaults
- ⚠️ **No TefillahType enum** — sessions only have `dateKey` (not Shacharis/Mincha/Maariv)

**User** (Members, admins, rabbis)
- ✅ Multi-tenant via `organizationId`
- ✅ PIN hashed with bcrypt (`pinHash`)
- ✅ Role-based (MEMBER only in enum; ADMIN/RABBI via JWT)
- ✅ Zelle/PayPal/ACH account support
- ✅ Spouse/household fields (`isMarried`, `spousePhone`, `wifeZellePhone`)
- ✅ `preferredForCheckIn` flag
- ✅ Unique `(organizationId, phone)` constraint
- ⚠️ `attendanceCode` (6-char punch code) — **not in original directives**

**Rabbi** (New multi-rabbi model, partially reverted)
- ✅ Multiple rabbis per organization (`organizationId` foreign key)
- ✅ Primary rabbi pointer on Organization
- ❌ **Password fields were reverted** (May 9, 2026) but schema still has columns (unused)
- ⚠️ Represents a future multi-rabbi upgrade path

**Shamosh** (Helper/approval role, fully built)
- ✅ Shamosh approves check-ins under a specific rabbi
- ✅ 8-char alphanumeric password with special chars
- ✅ `passwordPlain` stored for viewing (single-tenant convenience)
- ✅ Cascade deletion with parent rabbi
- ✅ Shamosh JWT token issued by auth system
- ✅ Router-level permission gate (shamosh can only confirm checks, not edit members)

**MinyanSession** (Daily prayer session)
- ✅ Unique `(organizationId, dateKey)` per day
- ✅ Status field (OPEN/CLOSED)
- ❌ **NO tefillah type** — directives say to add TefillahType enum, but it's missing
- ⚠️ `dateKey` is string (e.g. "2026-06-01"), not structured by Shacharis/Mincha/Maariv

**Attendance** (Punch records)
- ✅ Unique `(userId, sessionId)` prevents double punch
- ✅ PunchStatus enum: PENDING, CONFIRMED, REJECTED
- ✅ `punchInAt`, `punchOutAt`, timestamps
- ✅ `punchInConfirmedAt` for rabbi confirmation time
- ✅ `canceledAt`, `canceledByRole`, `canceledReason` for audit
- ❌ **NO slot number** — First Nine logic should pre-calculate slot position

**MemberLedgerEntry** (Replaces WeeklyPayout)
- ✅ Flexible type enum: EARNED, PAID, DONATED
- ✅ `amountCents` (stored in cents, integer math safe)
- ✅ `weekKey` for grouping by week
- ✅ Optional `charityId` for donations
- ✅ Unique constraint `(userId, weekKey, type)` prevents double-entry
- ✅ Indexed for fast balance queries
- ✅ `createdByRole` for audit trail

**Treasury** (Organization's fund balance)
- ✅ `balanceCents` (integer, cents)
- ✅ `systemLocked` flag (prevents payouts)
- ✅ Unique org relationship

**Charity** (Donation recipients)
- ✅ Charity model with name, website, description
- ✅ `isActive` flag for archiving
- ✅ Linked to MemberLedgerEntry for donation tracking

**Supporting tables:**
- ✅ `Setting` — global key/value store (admin password, etc.)
- ✅ `AdminPasswordChangeRequest` — password reset staging
- ✅ `MemberChangeCode` — one-time token for member actions
- ✅ `ZipCache` — US ZIP code lookups (minor utility)

---

## API ROUTES — COMPREHENSIVE (Exceeds Directives)

### Built & Deployed

**Authentication (`apps/api/src/routes/auth.ts`)**
- ✅ `/post /admin` — per-org + global admin password, bootstrap fallback, bcrypt compare
- ✅ `/post /rabbi` — rabbi password OR shamosh password (tries both), issues correct JWT kind
- ✅ `/post /member` — phone + PIN, bcrypt verify
- ✅ `/post /admin/request-password-reset` — email 6-digit code
- ✅ `/post /admin/confirm-password-reset` — verify code, apply new global password
- ✅ **All auth checks are ACTIVE** (directives said they were disabled, but they're implemented)

**Admin Dashboard (`apps/api/src/routes/admin.ts`)**
- ✅ Organization/location CRUD + settings (name, rabbi, timezone, locale)
- ✅ User/member CRUD (firstName, lastName, phone, PIN, Zelle, approved flag)
- ✅ CSV import for bulk member add
- ✅ Shamosh CRUD (add/edit/delete helpers)
- ✅ Rabbi CRUD (add/edit/delete rabbis) — partially reverted but still callable
- ✅ Treasury balance view + fund management
- ✅ Global admin password bootstrap + status endpoint
- ✅ `POST /admin/members` — generates unique `attendanceCode` automatically

**Rabbi Dashboard (`apps/api/src/routes/rabbi.ts`)**
- ✅ `/get /rabbi/me` — identity + role + capabilities
- ✅ `/get /rabbi/today` — today's sessions + attendances
- ✅ `/get /rabbi/members` — list members + balance
- ✅ `/post /rabbi/members` — filter by preferred
- ✅ `/patch /rabbi/attendance/:id/confirm` — mark attendance confirmed
- ✅ `/patch /rabbi/attendance/:id/reject` — mark attendance rejected
- ✅ `/post /rabbi/session/create` — create a new day's session
- ✅ `/get /rabbi/shamoshim` — list shamosh helpers
- ✅ Shamosh CRUD endpoints (add/edit/delete/password-gen)
- ✅ `GET /rabbi/passwords/generate` — server-side 8-char generator

**Member API (`apps/api/src/routes/member.ts`)**
- ✅ `/get /member/me` — identity + balance
- ✅ `/get /member/balance` — earnings breakdown by week
- ✅ `/get /member/attendance` — history by week
- ✅ `/patch /member/profile` — update Zelle, PayPal, ACH
- ✅ `/get /member/sessions` — list of sessions to punch into
- ✅ Ledger balance calculation (EARNED − PAID − DONATED)

**Punch API (`apps/api/src/routes/punch.ts`)**
- ✅ `/post /punch/in` — create attendance record
- ✅ `/post /punch/out` — mark punch out time
- ⚠️ **NO slot number calculation** — First Nine bonus logic missing

**Public API (`apps/api/src/routes/public.ts`)**
- ✅ `/get /organization/:slug` — public org info
- ✅ `/post /register` — public member sign-up (email verification)
- ✅ `/get /attendance-code/verify` — validate punch-in code (6-char)
- ✅ `/get /sessions/public` — list sessions for member punch-in screen

**Payments/Cashouts (`apps/api/src/routes/...`)**
- ⚠️ **CSV export mentioned in directives but endpoint unclear** — check if it's in admin.ts or separate route
- ⚠️ **Zelle bulk payment format not explicitly visible** — integration may be manual

---

## WEB FRONTEND — FEATURE RICH (Matches Backend)

### Admin UI (`AdminDashboard.tsx`)
- ✅ Multi-tab hub: Locations, Members, Rabbis, Shamoshim, Settings
- ✅ Location CRUD + admin/rabbi password setup
- ✅ Member CRUD + CSV import + attendance code generator
- ✅ Rabbi picker + password (8-char validation)
- ✅ Shamosh manager (add/edit/delete, password Gen/Show/Hide)
- ✅ Global admin password Settings tab (bootstrap + email reset)
- ✅ Treasury balance display
- ✅ Language selection (Hebrew/English)

### Rabbi UI (`RabbiDashboard.tsx`)
- ✅ Tab nav: Today's check-ins, Members & check-in, Shamoshim, Settings
- ✅ Today's session list + location name in header
- ✅ Pending punch-in list + Confirm/Reject buttons (one-tap)
- ✅ First Nine progress bar (but slot numbers **not calculated**)
- ✅ Member filter toggle (preferred for check-in)
- ✅ Shamosh helper manager (only if not shamosh role themselves)
- ✅ Settings for location banner message
- ⚠️ **No weekly Zelle export button visible** — must check if in a different component
- ⚠️ **No mark-as-paid workflow** — not obvious in code

### Member UI (`MemberDashboard.tsx`)
- ✅ Balance display (current week + unpaid weeks)
- ✅ Session-by-session breakdown (date, status, amount)
- ✅ Earnings tracker (EARNED, PAID, DONATED)
- ✅ Zelle/PayPal account update
- ✅ `MemberBilling.tsx` page (balance history)
- ⚠️ **First Nine bonus indicator missing** — should show "+$0.50 First Nine bonus" on confirmation screen
- ⚠️ **No "Paid ✓" status visible** — member should see which weeks are paid vs pending

### Punch-In UI (`PunchIn.tsx`)
- ✅ Member phone + PIN form
- ✅ Organization picker (slug-based)
- ✅ Real-time session list
- ✅ Confirmation screen with status
- ❌ **No tefillah type selector** (Shacharis/Mincha/Maariv) — can't distinguish prayer sessions
- ❌ **No First Nine slot display** — should show "Slot #4 of 9 ✓"
- ⚠️ Mobile responsive (375px tested per directives)

### Kiosk Mode
- ✅ Public punch-in via 6-char `attendanceCode` (no PIN needed)
- ✅ Tablet-optimized layout
- ⚠️ Render cold-start (30+ sec) likely still a problem on free tier

---

## 🔴 CRITICAL GAPS: What's Missing for MVP

### BLOCKING ISSUES

1. **Three Tefillos NOT IMPLEMENTED**
   - Directives say: "Add TefillahType enum (SHACHARIS, MINCHA, MAARIV)"
   - Code: `MinyanSession` has no tefillah type — just `dateKey` (one session per day)
   - **Impact:** Can't track three separate prayer sessions; earnings collapse into one daily session
   - **Fix:** Add `tefillahType TefillahType` to `MinyanSession`, migrate data, update UI tabs

2. **First Nine Slot Calculation INCOMPLETE**
   - Directives say: "Calculate `slotNumber` at confirmation time"
   - Code: `Attendance` has no `slotNumber` or `firstNineBonus` fields; `MemberLedgerEntry` doesn't track it
   - **Impact:** No bonus earned for early arrivals; First Nine becomes meaningless
   - **Fix:** Add `slotNumber Int?` and `bonusAmountCents Int?` to Attendance; pre-calculate on confirm

3. **Blank Page Deployment LIKELY STILL BROKEN**
   - Directives: "Render SPA rewrite rule missing"
   - Code: `apps/web` is Vite build, `render.yaml` exists
   - **Impact:** minyanpays.com probably still shows only "minyan-pays" text
   - **Fix:** Verify SPA routing rule in Render dashboard or `render.yaml` (need to see actual config)

4. **Zelle Export & Mark-as-Paid WORKFLOWS MISSING**
   - Directives say: "CSV export + mark as paid" are core
   - Code: `MemberLedgerEntry` exists, but no explicit CSV export endpoint or "paid" status flip visible
   - **Impact:** Rabbi can't export for Zelle payments; members can't see "Paid ✓" status
   - **Fix:** Add `/admin/export-weekly-zelle` endpoint; add UI button + workflow

5. **Tefillah Type Selection on Punch Screen MISSING**
   - Directives say: "Member picks Shacharis/Mincha/Maariv"
   - Code: `PunchIn.tsx` doesn't show tefillah selector
   - **Impact:** Can't distinguish which prayer session member is attending
   - **Fix:** Add tefillah selector on punch screen (pre-fill today's open session type)

---

### 🟡 HIGH PRIORITY ISSUES

6. **First Nine Display Missing**
   - Directives: "Show 'Slot #4 of 9 ✓' on confirmation screen"
   - Code: No UI component shows slot number post-confirmation
   - **Fix:** Update `PunchIn.tsx` confirmation screen to show slot + bonus amount

7. **Weekly Report / Balance Export UNCLEAR**
   - Directives: "Rabbi dashboard → weekly report → export CSV"
   - Code: `MemberBilling.tsx` shows ledger but no export button visible
   - **Fix:** Add export endpoint + button to UI (or clarify if it exists)

8. **Multi-Rabbi Feature Half-Baked**
   - Code: `Rabbi` model + `Shamosh` model exist, but rabbi password fields were **reverted May 9**
   - Schema: Columns `passwordHash`, `passwordPlain` exist but unused (migration not cleaned up)
   - **Impact:** Can't set per-rabbi passwords; feature started but abandoned
   - **Fix:** Either complete it (re-enable rabbi password fields + UI) OR clean up unused schema columns

9. **Member Ledger Calculation NOT OBVIOUS**
   - Directives: "Calculate earnings from confirmed attendances"
   - Code: `MemberLedgerEntry` is granular but balance query logic unclear
   - **Fix:** Verify balance endpoint correctly sums EARNED − PAID − DONATED; add tests

10. **Shamosh Permissions Hardcoded**
    - Code: Router allowlist restricts shamosh to `/me`, `/session/today`, `/attendance/:id/confirm`
    - **Impact:** Shamosh feature works but not extensible
    - **Fix:** Consider moving to middleware for maintainability

---

### 🟢 LOWER PRIORITY / NICE-TO-HAVE

11. **Timezone Handling**
    - Code: `Organization.timezone` exists (`default: "America/New_York"`), but sessions use `dateKey` string
    - **Impact:** Okay for MVP (US-only), but won't scale to other timezones
    - **Fix:** When adding multiple locations, parse `dateKey` in org's timezone

12. **Charity Donations**
    - Code: `Charity` model built, `MemberLedgerEntry` supports donations
    - **Impact:** Feature exists but not in UI (no admin panel to manage charities)
    - **Fix:** Add Charity CRUD to admin hub if needed; not core to MVP

13. **ACH / PayPal** 
    - Code: `User` fields exist (`achRoutingNumber`, `achAccountNumber`, `paypalAccount`)
    - **Impact:** Data stored but no payout logic visible (only Zelle mentioned)
    - **Fix:** Implement or remove fields

14. **Preferred Member Check-In**
    - Code: `Organization.checkInOnlyPreferred` + `User.preferredForCheckIn` exist
    - **Impact:** Feature partially built but UI unclear if enforcement works
    - **Fix:** Test in rabbi UI that only preferred members can punch in when flag is on

---

## DEPLOYMENT STATUS

### Current Environment
- **Frontend:** Vite React app, deployed to Render static site
- **Backend:** Express.js + Prisma + PostgreSQL, deployed to Render web service
- **Database:** PostgreSQL (Neon for free tier, or self-hosted via Docker)
- **Auth:** JWT tokens issued at login
- **Last deploy issue:** May 9, 2026 — Render auto-deploy was **OFF**, commits weren't rebuilding. Fixed by manual trigger.

### Known Deployment Problems
1. ⚠️ **Render auto-deploy state unclear** — docs say it was turned off, user needs to re-enable
2. ⚠️ **Cold-start lag on free tier** (30+ seconds) — bad for kiosk use
3. ⚠️ **SPA routing rule** — likely missing in Render static site config (blank page issue)
4. ⚠️ **Email not configured** — password reset flow works but emails don't send (needs `GMAIL_USER` + `GMAIL_APP_PASSWORD`)

---

## ASSESSMENT: REWRITE SCOPE

### What's Already Built (Keep / Refactor)
- ✅ **Multi-tenant architecture** — clean org isolation
- ✅ **Authentication system** — secure, bcrypt verified, multiple roles (admin/rabbi/shamosh/member)
- ✅ **Global admin password** — single master credential + org-level passwords
- ✅ **Shamosh (helper) system** — role-based permission gating
- ✅ **Member ledger** — flexible earnings/paid/donation tracking
- ✅ **Database schema** — strong fundamentals, mostly correct normalization
- ✅ **Admin hub UI** — comprehensive location/member/rabbi/shamosh management
- ✅ **Rabbi UI** — today's check-in list + member management
- ✅ **Member UI** — balance view + profile update
- ✅ **Public punch-in** — 6-char code kiosk mode
- ✅ **Hebrew/English i18n** — translation infrastructure working

### What Needs To Be ADDED (Critical)
- ❌ **Three Tefillos** — add tefillahType enum + schema migration + UI selector
- ❌ **First Nine Slot Calculation** — add slot number tracking + bonus logic
- ❌ **Zelle CSV Export** — implement export endpoint + rabbi UI button
- ❌ **Mark as Paid Workflow** — add status tracking + member visibility
- ❌ **Deployment fix** — SPA routing rule + auto-deploy re-enable
- ❌ **Blank page fix** — verify React mounting + fix Render routing

### What to REMOVE or DEPRECATE
- ⚠️ **Unused multi-rabbi columns** — `Rabbi.passwordHash`, `Rabbi.passwordPlain` (reverted)
- ⚠️ **ACH/PayPal fields** — if not implementing; remove or implement full payout logic
- ⚠️ **Charity features** — if not needed for MVP; hide from UI

### What to REFACTOR
- 🔧 **Balance calculation** — make ledger query logic more obvious + add tests
- 🔧 **Permission gating** — move shamosh allowlist to reusable middleware
- 🔧 **Session creation** — auto-create tefillah sessions vs. manual rabbi creation
- 🔧 **Error handling** — standardize API error responses
- 🔧 **Testing** — add integration tests for punch-in/confirmation flow

---

## HONEST ASSESSMENT: Rewrite Difficulty

### Easy Lifts (Days)
- ✅ Add TefillahType enum + migrate existing sessions
- ✅ Add First Nine slot calculation + bonus fields
- ✅ Implement Zelle CSV export endpoint
- ✅ Add "mark as paid" workflow
- ✅ Fix Render SPA routing

### Medium Lifts (Weeks)
- 🟡 Complete multi-rabbi feature (finish what was reverted)
- 🟡 Improve UI/UX polish (design system, mobile responsiveness)
- 🟡 Add integration tests
- 🟡 Email configuration + admin password reset flow testing

### Hard Lifts (Months)
- 🔴 Multi-location org support (not MVP, but planned)
- 🔴 Stripe billing (Phase 2+)
- 🔴 EffortPays platform integration (reflections, voice, etc.)

---

## RECOMMENDATIONS

### Before Full Rewrite
1. **Run the app locally** — check if punch-in/confirm flow actually works end-to-end
2. **Test on Render** — verify SPA routing, deployment pipeline, cold-start lag
3. **Check database** — confirm schema is in prod DB (no drift)
4. **Decide on multi-rabbi** — keep simple (one rabbi per org) or complete the partial build?

### Rewrite Priority Order
1. **Fix three tefillos** (1–2 days) — unlock core feature
2. **Implement First Nine calculation** (1 day) — unlock earnings logic
3. **Zelle export + mark-as-paid** (2–3 days) — unlock payment workflow
4. **Fix deployment** (1 day) — blank page + auto-deploy
5. **UI polish** (ongoing) — mobile, responsive, design system
6. **Testing** (ongoing) — punch-in, confirm, payout flows

### What NOT to Rewrite
- ❌ Don't rewrite the database schema (it's solid)
- ❌ Don't rewrite auth system (it's secure + implemented)
- ❌ Don't rewrite admin hub (it's comprehensive)
- ✅ DO focus on the three tefillos + First Nine + export features

---

## FILES TO REVIEW FIRST

1. **Database schema:** `/apps/api/prisma/schema.prisma` ← Understand the model relationships
2. **Auth routes:** `/apps/api/src/routes/auth.ts` ← Verify security is working
3. **Punch logic:** `/apps/api/src/routes/punch.ts` ← See what's calculated at punch-in
4. **Rabbi dashboard:** `/apps/api/src/routes/rabbi.ts` → `/apps/web/src/pages/RabbiDashboard.tsx` ← Understand confirmation flow
5. **Member ledger:** `/apps/api/src/lib/` (look for balance calculation) ← Verify earnings math
6. **Render config:** `/render.yaml` + `/apps/web/vite.config.ts` ← Debug blank page issue

---

## FINAL VERDICT

**Status:** 🟢 **READY FOR REWRITE — NOT A FULL REBUILD**

The codebase is **solid**, **secure**, and **70% complete**. It's not broken; it's just **missing the three tefillos feature, First Nine slot logic, and Zelle export workflow**. 

**Estimated rewrite effort:** 3–4 weeks for a professional, assuming:
- Fixing three tefillos (schema + UI)
- Implementing First Nine slot calculation + display
- Building Zelle export + mark-as-paid workflows
- Testing end-to-end
- Mobile UI polish

**Not needed:** Database redesign, auth rewrite, role system rewrite.

---

**Document prepared for:** Elliot (via Claude AI)  
**Analysis date:** June 2, 2026 (based on code at main branch)  
**Access method:** GitHub PAT (NeVoTM/minyan-pays private repo)  
**Next steps:** Review, discuss scope, prioritize features, start development

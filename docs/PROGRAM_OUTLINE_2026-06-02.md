# MinyanPays — Program Outline & Database Schema

**Created:** June 2, 2026  
**Purpose:** Complete program specification based on analysis of directives + actual codebase  
**Audience:** Elliot (for rewrite planning) + development team

---

## PROGRAM PURPOSE & CORE VALUE PROPOSITION

**What is MinyanPays?**
A SaaS web application that enables Orthodox Jewish synagogues (Minyan organizations) to track prayer attendance (minyan), manage member participation, confirm attendance via rabbi approval, calculate earnings, and process automatic weekly Zelle payouts.

**Target User:** Rabbi or Gabbai (synagogue administrator) in Crown Heights, Brooklyn for initial launch  
**Target Members:** Men who show up for prayers and earn money for their attendance

---

## CORE FEATURES (MVP)

### 1. **Member Punch-In/Punch-Out System**
- Members use mobile device (iPhone or kiosk tablet) to tap "Punch In" button
- Captures phone number + 4-digit PIN authentication
- Session persists in database for rabbi to confirm/reject
- Simple, fast UX (under 10 seconds to complete)
- Works on iPhone 375px (SE) and tablet kiosk modes
- Kiosk mode: 6-char `attendanceCode` (no PIN needed)

### 2. **Three Daily Tefillos (Prayer Sessions)** ❌ NOT IMPLEMENTED YET
- Track Shacharis (morning), Mincha (afternoon), Maariv (evening) **separately**
- Each session type has its own attendance list
- Rabbi can create sessions with one tap per tefillah
- Each session shows: date, time, tefillah type, member count, first nine status
- Different payout rates possible per tefillah type
- **Current gap:** Only one session per day (no TefillahType enum in schema)

### 3. **First Nine Slot System** 🏆 PARTIALLY BUILT
- The first 9 confirmed members earn a bonus per session
- Financial incentive to show up early
- Display shows: "Slot #4 of 9 ✓" on member confirmation screen
- Rabbi sees visual progress bar: "First Nine: ✓ ✓ ✓ ✓ · · · · ·"
- Configurable slots count and bonus amount per org
- **Current gap:** Slot calculation not implemented (no slotNumber tracking in Attendance)

### 4. **Rabbi Confirmation / Rejection Flow**
- Rabbi logs in, sees today's pending punch-ins (real-time or on refresh)
- One-tap confirm/reject workflow (no modals, no extra screens)
- Status colors: Gray (pending) → Yellow (pending) → Green (confirmed) → Red (rejected)
- Optimistic UI updates - rabbi sees changes immediately
- ✅ **IMPLEMENTED** (partially via `/rabbi/attendance/:id/confirm`)

### 5. **Member Balance & Earnings View**
- Display current week's earnings (e.g., "$8.50")
- Display unpaid weeks (e.g., "Last week $6.00")
- Show session-by-session breakdown:
  - Shacharis Mon $1.50 (+ $0.50 First Nine bonus)
  - Maariv Mon $1.00
  - Mincha Tue $1.50
  - (Missed) Mincha Wed
- Display total owed across all weeks
- Show payout method: Zelle number on file with option to update
- ✅ **PARTIALLY IMPLEMENTED** (via MemberLedgerEntry, but no First Nine bonus tracking)

### 6. **Weekly Zelle Export (Core Value Prop)** ❌ MISSING
- Rabbi clicks "📥 Export This Week for Zelle Payout" button
- Downloads CSV file: `minyanpays-week-YYYY-MM-DD.csv`
- CSV format: Name, Phone, Zelle Number, Total Owed, Session Breakdown
- Rabbi manually pays via Zelle on Erev Shabbat (Friday night/Saturday morning)
- Treasury balance gate: warns if not enough funds, but allows export anyway
- **Current gap:** No export endpoint or UI button visible

### 7. **Mark as Paid Workflow** ❌ MISSING
- After exporting, rabbi taps "✓ Mark Week as Paid"
- Confirms all earnings for that week as processed
- Members then see "Paid ✓" status next to that week in their balance view
- **Current gap:** No paid status tracking in WeeklyPayout/MemberLedgerEntry

### 8. **Rabbi Dashboard / Today's Home Screen**
- Loads immediately on rabbi login
- Shows today's sessions (Shacharis, Mincha, Maariv) with pending punch-ins
- Summary stats: "Confirmed: 14 | Pending: 3 | Rejected: 1 | First Nine: 9/9 ✓"
- Rabbi banner message (customizable) shown to all members
- ✅ **IMPLEMENTED** (via RabbiDashboard.tsx)

### 9. **Admin Organization Setup**
- Single-page org configuration form
- Fields: Shul name, slug, city, rabbi name, weekly payout per session, first nine bonus amount, first nine slots count, treasury balance, admin password, rabbi password
- CSV member import: bulk add members with phone, PIN, Zelle number
- Demo seed script to populate sample data for testing
- ✅ **IMPLEMENTED** (AdminDashboard.tsx with comprehensive location/member management)

### 10. **Treasury Management**
- Admin view of current treasury balance
- Add/deduct funds manually
- Lock treasury (prevents payouts but allows export)
- Shows alerts if balance < upcoming payout total
- ✅ **IMPLEMENTED** (Treasury model + admin UI)

### 11. **Mobile & Kiosk Optimization**
- iPhone 375px (SE) responsive design
- Tablet kiosk mode for punch-in screen (6-char code)
- All buttons ≥ 48px height (tap-friendly)
- 16px+ font size on inputs (prevents iOS zoom)
- No horizontal scrolling anywhere
- Safe area inset for iPhone notch/home indicator
- ✅ **MOSTLY IMPLEMENTED** (needs testing/polish)

### 12. **i18n: English & Hebrew**
- Key screens translated: punch-in, balance, rabbi confirmation
- Language toggle visible without login
- Stored in localStorage, defaults to English
- ✅ **IMPLEMENTED** (i18n infrastructure working)

### 13. **Shamosh (Helper) Role** ✅ FULLY BUILT
- Shamosh approves check-ins under a rabbi (doesn't manage members/payouts)
- Shamosh has 8-char alphanumeric password
- Limited permissions: can only confirm today's checks
- Multiple shamoshim per rabbi/location
- **Feature exceeds original directives** (not mentioned in original spec)

---

## DATABASE SCHEMA (As Currently Implemented)

### **Actual vs. Envisioned**

The codebase has a **more mature schema than original directives described**, with multi-rabbi/shamosh architecture. However, it's **missing three tefillos support**.

### Key Models

#### **Organization** (Core location entity)
- `id`, `slug` (unique), `name`, `kind` (SYNAGOGUE | STUDY_HALL)
- Contact info: `synagogueName`, `locationAddress`, `locationPhone`, `locationEmail`, `locationWebsite`
- Rabbi info: `rabbiName`, `rabbiAddress`, `rabbiPhone`, `rabbiEmail`, `rabbiBanner`
- Pricing: `firstNineCents`, `weeklyBonusCents`, `firstNineSlots`
- Security: `adminPasswordHash`, `rabbiPasswordHash`, `rabbiPasswordPlain`
- Settings: `timezone` (default: "America/New_York"), `defaultLocale` (default: "he"), `checkInOnlyPreferred`
- Geo: `checkInLatitude`, `checkInLongitude` (optional)
- Relations: users, rabbis, shamoshim, minyan_sessions, treasury, charities, cashout_requests, ledger_entries

#### **User** (Members, admins, rabbis)
- `id`, `organizationId`, `firstName`, `lastName`, `phone` (unique per org)
- Auth: `pinHash` (bcrypt), `role` (MEMBER | ADMIN via JWT), `isApproved`
- Payout: `zellePhone`, `wifeZellePhone`, `bonusRecipient` (SELF | WIFE)
- Household: `isMarried`, `spousePhone`, `spouseEmail`
- Alternate payout: `paypalAccount`, `achRoutingNumber`, `achAccountNumber`
- Address: `addressLine1`, `addressLine2`, `city`, `stateRegion`, `postalCode`
- Check-in: `attendanceCode` (6-char unique), `preferredForCheckIn`
- Relations: attendances, weeklyPayouts, ledger_entries, changeodes, cashout_requests

#### **Rabbi** (Multi-rabbi model, partially built)
- `id`, `organizationId`, `name`, `address`, `city`, `stateRegion`, `postalCode`, `phone`, `email`
- Relations: shamoshim, (unused passwordHash/passwordPlain from reverted feature)
- **Note:** Multi-rabbi feature was reverted May 9 but schema columns remain

#### **Shamosh** (Helper/approval role, fully built)
- `id`, `organizationId`, `rabbiId`, `name`, `phone`, `email`
- Auth: `passwordHash` (8-char with special), `passwordPlain` (for viewing)
- Permissions: router-level allowlist (`/me`, `/session/today`, `/attendance/:id/confirm` only)

#### **MinyanSession** (Daily prayer session)
- `id`, `organizationId`, `dateKey` (e.g., "2026-06-01"), `status` (OPEN | CLOSED)
- ❌ **MISSING:** `tefillahType` enum (SHACHARIS, MINCHA, MAARIV, OTHER)
- Relations: attendances

#### **Attendance** (Punch records)
- `id`, `sessionId`, `userId`, `punchInAt`, `punchOutAt`
- Status: `punchInStatus` (PENDING | CONFIRMED | REJECTED), `punchInConfirmedAt`
- Audit: `canceledAt`, `canceledByRole`, `canceledReason`
- ❌ **MISSING:** `slotNumber Int?` (1-based position in First Nine)
- Unique: `(userId, sessionId)` prevents double punch-in

#### **MemberLedgerEntry** (Flexible earnings/payment tracking)
- `id`, `organizationId`, `userId`, `type` (EARNED | PAID | DONATED)
- `amountCents` (integer, safe from floating-point errors)
- `weekKey` (e.g., "2026-05-26" for week starting Monday)
- `charityId` (optional, for donations)
- `createdByRole` (audit trail)
- Unique: `(userId, weekKey, type)` prevents double-entry

#### **Treasury** (Organization fund balance)
- `organizationId` (unique), `balanceCents`, `systemLocked` (prevents payouts)

#### **Charity** (Donation recipients)
- `id`, `organizationId`, `name`, `website`, `description`, `isActive`
- Relations: ledger_entries (for donation tracking)

#### **CashoutRequest** (Member payout request)
- `id`, `organizationId`, `userId`, `amountCents`
- Status: `status` (PENDING | APPROVED | REJECTED | PAID), `paidAt`
- Note: `note`

#### **Supporting Tables**
- `Setting` — global key/value store (admin passwords, etc.)
- `AdminPasswordChangeRequest` — password reset staging (email flow)
- `MemberChangeCode` — one-time token for member actions
- `ZipCache` — US ZIP code lookups

---

## DATABASE INTEGRITY ASSESSMENT

### ✅ STRONG POINTS
1. **Multi-tenant isolation** — `organizationId` on every record
2. **Role-based access** — MEMBER/RABBI/ADMIN/SHAMOSH roles with permission gating
3. **Audit trail** — `confirmedAt`, `paidAt`, `createdByRole` timestamps
4. **Financial accuracy** — stored in cents (integer), calculated at confirmation time (immutable)
5. **Unique constraints** — `(organizationId, phone)` prevents duplicate users; `(sessionId, userId)` prevents double punch
6. **Flexible ledger** — EARNED/PAID/DONATED model supports future features
7. **Soft deletes ready** — `isActive`, `isApproved` flags instead of hard deletes
8. **Temporal logic** — date-based session grouping (`weekKey`) for accurate reporting
9. **Shamosh permissions** — role-based JWT gating + router allowlist

### ⚠️ AREAS FOR ENHANCEMENT

1. **Missing Three Tefillos**
   - **Add to schema:** `enum TefillahType { SHACHARIS MINCHA MAARIV OTHER }`
   - **Add to MinyanSession:** `tefillahType TefillahType @default(SHACHARIS)`
   - **Data migration:** Create separate sessions for each tefillah per day
   - **Impact:** Unlock per-tefillah earnings tracking

2. **Missing First Nine Slot Tracking**
   - **Add to Attendance:** `slotNumber Int?` (calculated at confirmation)
   - **Add to MemberLedgerEntry:** `firstNineBonusAmountCents Int @default(0)`
   - **Logic:** At confirm time, count CONFIRMED attendances for this session before this one
   - **Impact:** Properly calculate and track First Nine bonuses

3. **Missing Paid Status**
   - **Add to MemberLedgerEntry:** `status` enum (EARNED, PAID, DISPUTED)
   - OR **Add to WeeklyPayout:** `status` enum (PENDING, EXPORTED, PAID)
   - **Impact:** Members see "Paid ✓" after rabbi confirms payment

4. **Password Storage Pattern**
   - **Current:** Admin passwords stored in `.env` + `Setting` table (plaintext mirror for viewing)
   - **Risk:** Single-tenant convenience, not production-grade
   - **Fix:** For multi-tenant, remove plaintext mirrors

5. **Cold-Start UX**
   - **Issue:** Render free tier 30+ second wake-up time
   - **Impact:** Bad for kiosk punch-in use case
   - **Solution:** Upgrade Render tier or use serverless

---

## NEXT STEPS FOR REWRITE

### Phase 1: Schema & Core Features (1–2 weeks)
1. Add `TefillahType` enum + `MinyanSession.tefillahType` + data migration
2. Add `Attendance.slotNumber` + `slotCalculation` logic on confirm
3. Add `MemberLedgerEntry.paidStatus` or new `WeeklyPayout.status` field
4. Create `/admin/export-weekly-zelle` endpoint
5. Add "Mark as Paid" button + workflow to rabbi UI

### Phase 2: UI Polish (1–2 weeks)
1. Update `PunchIn.tsx` to show tefillah selector
2. Show "Slot #4 of 9 ✓ +$0.50 bonus" on confirmation
3. Add "Paid ✓" badge to member balance view
4. Add Zelle export button to rabbi dashboard
5. Test all screens at 375px + kiosk mode

### Phase 3: Deployment & Testing (1 week)
1. Fix SPA routing on Render (blank page issue)
2. Enable Render auto-deploy
3. Configure email (GMAIL_USER + GMAIL_APP_PASSWORD)
4. Integration testing: punch-in → confirm → balance → export → paid
5. User acceptance testing with Crown Heights rabbi

---

## SUCCESS CRITERIA

- [ ] Three tefillos tracked separately
- [ ] First Nine bonus calculated correctly ($0.50 per slot, only slots 1–9)
- [ ] Member sees "Slot #4 of 9 ✓ +$0.50" on confirmation
- [ ] Rabbi can export CSV with all members + earnings
- [ ] Rabbi can mark week as paid
- [ ] Member sees "Paid ✓" after rabbi marks paid
- [ ] All screens work on iPhone 375px
- [ ] Kiosk mode works on tablet
- [ ] Minyanpays.com loads fully (no blank page)
- [ ] Zero data loss on re-deployment

---

**Document prepared for:** Elliot  
**Program:** MinyanPays (EffortPays flagship MVP)  
**Status:** Ready for rewrite planning  
**Created:** June 2, 2026

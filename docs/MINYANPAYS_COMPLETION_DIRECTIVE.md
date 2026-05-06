# MinyanPays — Cursor Completion Directive
### Focused: Minyan attendance only. Ship this. Nothing else.

*Paste this into Cursor. Read PROGRAMMER_HANDOFF.md first, then this file.*

---

## SCOPE LOCK

This sprint is **MinyanPays only**. Do not build reflections, voice input, prize store,
ShiurPays, EffortPays branding, or any other program. Every task below is about making
the existing minyan attendance + payout app work correctly and look professional.
When complete, a rabbi in Crown Heights can run his shul on this.

---

## CURRENT PROBLEM (confirmed)

**minyanpays.com loads a blank page** — only the text "minyan-pays" is visible.
The React app is not mounting. Fix this before anything else.

---

## TASK 1 — Fix the Render Deployment (DO THIS FIRST)

### 1a. Verify Render static site settings
In `render.yaml` or Render dashboard, confirm:
```
Build command:  cd apps/web && npm install && npm run build
Publish dir:    apps/web/dist
```
If publish dir is set to just `dist` or `web/dist` — that is the bug. Fix it.

### 1b. Add the SPA rewrite rule
Render static sites need this or every route returns a 404 instead of index.html.
In Render dashboard → your static site → Redirects/Rewrites:
```
Source:       /*
Destination:  /index.html
Action:       Rewrite
```
Or add to `render.yaml`:
```yaml
staticSite:
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
```

### 1c. Copy 404.html after build
In `apps/web/package.json`, update the build script:
```json
"build": "vite build && cp dist/index.html dist/404.html"
```

### 1d. Verify VITE_API_BASE_URL
In Render dashboard → static site → Environment:
```
VITE_API_BASE_URL = https://[your-api-service-name].onrender.com
```
This must point to the live API service URL, not localhost.

### 1e. Verify API service is running
In Render dashboard → your API web service:
- Check logs for startup errors
- Hit `https://[api-url].onrender.com/api/health` — should return `{ status: "ok" }`
- If it's sleeping (free tier), wake it up

### 1f. After fixes — smoke test
- [ ] minyanpays.com loads the React app
- [ ] minyanpays.com/punch loads the punch-in screen
- [ ] minyanpays.com/admin redirects to admin login
- [ ] No console errors in browser devtools

---

## TASK 2 — Fix Authentication (Security — Non-Negotiable)

File: `apps/api/src/routes/auth.ts`

Historical note: this section was written when auth checks were disabled.
Current code has restored credential enforcement (admin/rabbi/member). Keep this section as security intent and re-verify behavior before launch:

### 2a. Admin login
```typescript
// POST /api/auth/admin
// Currently: issues token without checking password
// Fix: compare submitted password against ADMIN_PASSWORD env var
import crypto from 'crypto';

const submitted = req.body.password;
const expected = process.env.ADMIN_PASSWORD;
if (!submitted || !expected) return res.status(401).json({ error: 'Unauthorized' });
// Use timing-safe compare to prevent timing attacks
const match = crypto.timingSafeEqual(
  Buffer.from(submitted.padEnd(64)),
  Buffer.from(expected.padEnd(64))
);
if (!match) return res.status(401).json({ error: 'Invalid password' });
```

### 2b. Member login
```typescript
// POST /api/auth/member
// Currently: only checks phone + org + isApproved, skips PIN
// Fix: add bcrypt compare against pinHash
import bcrypt from 'bcrypt';

const user = await prisma.user.findFirst({
  where: { phone: req.body.phone, organizationId, isApproved: true }
});
if (!user) return res.status(401).json({ error: 'Not found' });
const pinMatch = await bcrypt.compare(req.body.pin, user.pinHash);
if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN' });
```

### 2c. Rabbi login
Restore credential check per whatever rabbi auth method exists in the codebase.
If rabbi has no stored credential yet, at minimum require a matching password
from `RABBI_PASSWORD` env var as a temporary measure.

### 2d. Update .env.example
```
DATABASE_URL=postgresql://...
JWT_SECRET=change_me_before_deploy
ADMIN_PASSWORD=change_me_before_deploy
RABBI_PASSWORD=change_me_before_deploy
WEB_ORIGIN=https://minyanpays.com
PORT=3001
```

---

## TASK 3 — Three Tefillos Tracking

Right now sessions are generic. A minyan shul tracks three separate tefillos daily.
Each has different attendance numbers and potentially different reward amounts.

### 3a. Add tefillah type to session
In `schema.prisma`, add to `MinyanSession` model:
```prisma
enum TefillahType {
  SHACHARIS
  MINCHA
  MAARIV
  OTHER
}

// Add to MinyanSession:
tefillahType  TefillahType  @default(SHACHARIS)
```

Run: `npx prisma migrate dev --name add_tefillah_type`

### 3b. Rabbi dashboard — session creation
When rabbi creates today's session, show three quick-create buttons:
```
[+ Shacharis]   [+ Mincha]   [+ Maariv]
```
Each creates a session pre-tagged with the correct `TefillahType` and today's date.

### 3c. Display
- In attendance lists, show the tefillah label next to each session
- In member balance view, show "Shacharis · Mon May 4" style entries
- In weekly report, group by tefillah type and show totals per type

---

## TASK 4 — First Nine Slot Display

The schema has `firstNineSlots` and `firstNineCents` on Organization.
Members who lock the first 9 spots earn a bonus. This needs to be visible.

### 4a. Punch-in screen
After a member punches in successfully, show:
```
✓ You're in!
Slot #4 of 9   ← their position if within first 9
+$1.50 first-minyan bonus earned
```
If slot 10+, just show the regular confirmation without the bonus message.

### 4b. Rabbi dashboard — today's session view
Show a row of 9 slots at the top of today's attendance list:
```
First Nine:  ✓ ✓ ✓ ✓ · · · · ·
```
Filled = confirmed attendances. Open = still available. Updates live.

### 4c. Calculate correctly
In `apps/api/src/lib/earnings.ts`, verify the First Nine logic:
- Slot number = count of CONFIRMED attendances for this session before this one
- Slot ≤ 9 AND session has firstNineCents > 0 → add bonus to earnings
- Slot > 9 → no bonus regardless

---

## TASK 5 — Weekly Zelle Export (Friday Workflow)

This is the core value prop. Rabbi exports Friday, pays manually via Zelle Sunday.

### 5a. Export format
CSV columns (in this order):
```
Member Name, Phone, Zelle Number, PayPal, Week (Mon-Sun), 
Shacharis Count, Mincha Count, Maariv Count, Total Sessions,
Base Earnings ($), First Nine Bonus ($), Total Owed ($),
Notes
```

### 5b. Rabbi dashboard — export button
On the weekly report page, prominent button:
```
[📥 Export This Week for Zelle Payout]
```
Downloads `minyanpays-week-YYYY-MM-DD.csv` immediately.

### 5c. Treasury gate
If `treasury.systemLocked = true`, show a warning banner:
```
⚠️ Treasury is locked. Payouts are paused. Contact admin.
```
Do not prevent export — rabbi can still see what's owed — but flag it clearly.

### 5d. "Mark as Paid" workflow
After exporting, rabbi should be able to mark the week as paid:
```
[✓ Mark Week as Paid]  →  confirms WeeklyPayout records
```
Members then see "Paid ✓" next to that week in their balance view.

---

## TASK 6 — Member Balance Screen

Members need to understand what they earned and when they'll get paid.

### 6a. Balance page layout
```
┌─────────────────────────────────┐
│  This week's earnings    $8.50  │
│  Last week (unpaid)      $6.00  │
│  Total owed             $14.50  │
└─────────────────────────────────┘

This Week — May 1–7
  ✓ Shacharis  Mon    $1.50 (+$0.50 First Nine)
  ✓ Maariv     Mon    $1.00
  ✓ Shacharis  Tue    $1.50
  ✗ Mincha     Wed    (missed)
  ...

Last Week — Apr 24–30   [Paid ✓]
  ...
```

### 6b. Payout method reminder
At bottom of balance page:
```
Your payout goes to Zelle: (917) 555-1234
Tap to update →
```

---

## TASK 7 — Rabbi Dashboard Polish

The rabbi is the primary daily user. His workflow must take under 2 minutes.

### 7a. Today's view on load
When rabbi logs in, immediately show today's sessions.
If no session exists yet for today, show the three tefillah buttons (Task 3b).
Do not make him navigate anywhere — today is the homepage.

### 7b. Confirm/reject flow
Each pending punch-in shows:
```
Yosef Goldberg   7:23am   [✓ Confirm]  [✗ Reject]
```
One tap confirms. No modal, no extra screen. Optimistic UI update.

### 7c. Session summary
Below the punch list, always show:
```
Confirmed: 14   Pending: 3   Rejected: 1
First Nine: 9/9 filled ✓
```

### 7d. Banner message
Rabbi can set a shul-wide message visible to all members.
Simple textarea in settings, saved to `Organization.rabbiBanner`.
Show banner on member punch-in screen and balance screen.

---

## TASK 8 — Mobile UX Pass

Everything must work on an iPhone SE (375px wide). Test every screen at this width.

### Checklist
- [ ] Punch-in button is large enough to tap with a thumb (min 48px height)
- [ ] Confirm/Reject buttons on rabbi screen don't overlap on small screens
- [ ] Member balance table doesn't overflow horizontally
- [ ] Bottom navigation is accessible above iPhone home indicator
- [ ] Forms don't zoom in on focus (set `font-size: 16px` on all inputs — iOS zooms if < 16px)
- [ ] No horizontal scrolling on any screen
- [ ] Loading states visible (spinner or skeleton) — Render free tier is slow to wake

---

## TASK 9 — Admin Org Setup

When a new shul onboards, admin needs to configure their org in under 10 minutes.

### 9a. Org settings page (admin)
Single form with all key fields:
```
Shul name:          _______________
Slug (URL):         minyanpays.com/[____]
City:               _______________
Rabbi name:         _______________
Weekly payout:      $ ___ per session
First Nine bonus:   $ ___ (0 = disabled)
First Nine slots:   [9]
Payout day:         [Friday ▾]
Treasury balance:   $ ___  [+ Add Funds]
Admin password:     ________
Rabbi password:     ________
```

### 9b. Member import via CSV
Admin can upload a CSV to bulk-add members.
Expected format:
```
First Name, Last Name, Phone, PIN, Zelle Number, Email (optional)
```
Server validates, creates users, returns a summary: "18 imported, 2 skipped (duplicate phone)."

### 9c. Demo org seed
Create a seed script `apps/api/prisma/seed-demo.ts`:
- Creates org: "Demo Shul" slug: "demo"
- Adds 10 sample members with realistic names
- Creates one week of attendance history
- Sets treasury balance to $200
- Admin password: "demo123", Rabbi password: "rabbi123"

Run with: `npx ts-node prisma/seed-demo.ts`
Use this for demos and testing. Never run on production.

---

## TASK 10 — Error States & Empty States

These are currently missing and make the app feel broken.

### Add these empty states:
- No sessions today → "No sessions yet today. Tap to create one." (rabbi view)
- No members → "No members yet. Import a CSV or add manually."
- No attendance history → "No attendance recorded yet this week."
- Treasury at $0 → "Treasury is empty. Add funds before payouts can be made."

### Add these error states:
- API unreachable → "Can't connect to server. Check your internet connection."
- Punch-in fails (not on preferred list) → "You're not on today's list. See your rabbi."
- Duplicate punch → "You already punched in for this session."

---

## TASK 11 — i18n: English & Hebrew

The app already has i18n set up. Make sure these key screens have Hebrew translations:
- Punch-in screen (members often prefer Hebrew)
- Balance screen
- Rabbi confirmation prompts

The language toggle should be visible on the punch-in screen without requiring login.
Default to English. Store preference in localStorage.

---

## COMPLETION CHECKLIST

Before calling this done, verify every item:

### Deployment
- [ ] minyanpays.com loads the full React app
- [ ] All routes work on direct navigation (no 404 on refresh)
- [ ] API health check returns 200
- [ ] No console errors on load

### Auth
- [ ] Admin login requires correct password
- [ ] Member login requires correct PIN
- [ ] Rabbi login requires correct credential
- [ ] Invalid credentials return 401, not 200

### Core Minyan Flow
- [ ] Member can punch in
- [ ] Rabbi sees pending punch-ins in real time (or on refresh)
- [ ] Rabbi can confirm or reject in one tap
- [ ] Confirmed attendance updates member balance
- [ ] First Nine bonus applies correctly to first 9 confirmed slots
- [ ] Member can punch out

### Three Tefillos
- [ ] Rabbi can create Shacharis / Mincha / Maariv sessions separately
- [ ] Each session type labeled correctly throughout
- [ ] Weekly report shows counts per tefillah type

### Payouts
- [ ] Weekly CSV export downloads with correct data
- [ ] Treasury balance shown to rabbi and admin
- [ ] Treasury lock shows warning, doesn't break export
- [ ] Mark as paid workflow works
- [ ] Member sees paid/unpaid status on balance screen

### Mobile
- [ ] All screens work at 375px
- [ ] No horizontal scroll
- [ ] All tap targets ≥ 48px height
- [ ] iOS input zoom prevented

### Admin Setup
- [ ] New org can be fully configured from settings page
- [ ] Member CSV import works
- [ ] Demo seed script runs without errors

---

## WHAT NOT TO BUILD IN THIS SPRINT

Hard stop. If you find yourself writing any of the following, stop and ask:

- ❌ Reflection forms or voice input
- ❌ EffortPays branding or renaming
- ❌ ShiurPays, FarbrengPays, CheiderPays, KollelPays
- ❌ Prize store or milestone system
- ❌ Stripe or subscription billing
- ❌ PlanLevel or ProgramType schema changes
- ❌ AI features of any kind

Those are Phase 2+. This sprint ships MinyanPays for Crown Heights. That's the goal.

---

*Read PROGRAMMER_HANDOFF.md. Start with Task 1 (fix the blank page). Work top to bottom.*

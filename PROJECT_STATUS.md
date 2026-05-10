# Project Status – Where We Left Off

*Last updated: 2026-05-10*

## Current Task / Goal

**Rabbi dashboard: location header, balance row, shamosh hub + view, edit fix (May 10 2026, `6bec621`).** Pushed to `origin/main`; Render auto-deploy is on so the rebuild should land within ~2 minutes. Smoke-test once the new `assets/index-*.js` hash appears at `https://minyanpays.com/`.

- **Header on every rabbi-tab now shows the location name** (`me.synagogueName || me.organizationName` from `/api/rabbi/me`). Solves the user's "rabbi must be assigned and connected to a location so the location must show up on header" requirement — the rabbi token is per-org, so the location is always known after login.
- **Tab buttons are no longer wrapping to 3 lines on phones.** The 5-tab nav now uses `grid-cols-5` always; small-screen labels are short ("Today", "Members") and `sm+` uses the full names ("Today's check-ins", "Members & check-in").
- **Members & check-in tab**: name + phone + recorded balance now render on a single tappable row with a filled radio circle (not a checkbox) for the preferred-for-check-in toggle. Tapping the row toggles preferred for that member. `GET /api/rabbi/members` now returns `balanceCents` (sum of EARNED − PAID − DONATED on `MemberLedgerEntry` for the org). Posted weeks reflect immediately.
- **Shamoshim tab restyled to match the admin Rabbi panel exactly**: Add / View / Edit / Delete hub buttons, click-to-select / double-click-to-edit one-line list, modal panel for the form. The form supports three modes — `add`, `view` (inputs disabled, password visible), `edit` (inputs editable, password pre-filled).
- **Critical fix**: shamosh edit form now pre-fills the existing password instead of leaving it blank. New nullable `Shamosh.passwordPlain` column stores the plaintext (same pattern as global admin + legacy per-org rabbi password). Saving with the field unchanged keeps the password as-is; saving with a new value updates both `passwordHash` and `passwordPlain`.
- **i18n cleanup**: added `common.edit` (was rendering as the literal "common.edit" button label), `common.add`, and the new `rabbi.*` keys for the location banner, members balance line, and shamosh hub buttons.

Schema change is purely additive (nullable column), so Render's `prisma db push` step in `render.yaml` applies it without `--accept-data-loss`. Local TS build is green for both `apps/api` and `apps/web`; no lints introduced.

**Setup Rabbi moved into Location Edit + auto-generated punch-in code (May 10 2026, `050ef12`).**
- The Location hub action row is back to three buttons (Add / View / Edit). The fourth "Setup Rabbi" button moved **inside the Location Edit modal** as a violet card with help copy and an "Open Rabbi setup" button — clicking it closes the Edit modal and switches to the Rabbi hub. Matches the user's spec that the rabbi connection belongs inside the Location Edit screen, not the header.
- Add Member's punch-in code field is **no longer required input**. `memberFieldsSchema.attendanceCode` is now optional with the same preprocess used by public registration; `POST /api/admin/members` calls `generateUniqueAttendanceCode` whenever the field is blank. New `GET /api/admin/attendance-code/generate` endpoint pre-fills the field as soon as the Add Member modal opens, and a small ↻ button lets you regenerate. Verified live: probe POSTs without `attendanceCode` and with `attendanceCode: ""` both returned 201 with server-picked codes (e.g. `DYEXVY`, `ETS4AD`).

**Global admin password live + email-confirmed change flow (May 10 2026, `eff62be`).** One password (`Aron$11213`) now authenticates the admin into every organization, and there is a Settings tab to view / rotate it with a 6-digit code emailed to `elichalfinny@gmail.com`. Production verified after Render rebuild:

- `POST /api/auth/admin` slug=`770`           pwd=`Aron$11213` → **200** (was 401 — fixed via global fallback).
- `POST /api/auth/admin` slug=`dovrey-evrit`  pwd=`Aron$11213` → **200** (still works — per-org match).
- `POST /api/auth/admin` slug=`770`           pwd=`NotMyPass!1` → **401** (wrong passwords still rejected).
- `GET  /api/admin/global-password` → `{ isSet: true, plain: "Aron$11213", notifyEmail: "elichalfinny@gmail.com", emailConfigured: false }`.
- `POST /global-password/request-change` returns **503** with an actionable message until `GMAIL_USER` + `GMAIL_APP_PASSWORD` are set on Render.

**Schema (additive, no data-loss flag needed):**
- `Setting` (key/value) stores `globalAdminPasswordHash` and `globalAdminPasswordPlain` (plaintext kept for the View feature; single-tenant convenience).
- `AdminPasswordChangeRequest` stages the new password + bcrypted code + expiry while waiting for confirmation.

**Server (`apps/api`):**
- `POST /api/auth/admin` now also accepts the global hash. Match priority: per-org `adminPasswordHash` → global `Setting[globalAdminPasswordHash]` → bootstrap env-var fallback (only when org has no hash).
- `GET /api/admin/global-password` — read-only status: `isSet`, `plain` (when set), `notifyEmail`, `emailConfigured`.
- `POST /api/admin/global-password/bootstrap` — direct set/replace of the global password without email. Always allowed for any logged-in admin (the email flow is preferred for normal rotation; bootstrap is the emergency / first-time / no-email-yet path). Regex: 8–64 chars, must include at least one letter, one digit, and one of `!@#$%^&*+-_=?$.,`.
- `POST /api/admin/global-password/request-change` — generates a 6-digit code, bcrypts both code and the staged new password, emails the code to `ADMIN_NOTIFY_EMAIL` (defaults to `elichalfinny@gmail.com`). Returns `requestId` + delivery status. Returns 503 if email isn't configured (or echoes the code when `ADMIN_PASSWORD_VERIFICATION_ECHO=1`).
- `POST /api/admin/global-password/confirm-change` — verifies code + applies the staged password. 5-attempt cap, 10-minute expiry, single-use.
- Email transport: `apps/api/src/lib/email.ts` (Nodemailer + Gmail SMTP via `GMAIL_USER` + `GMAIL_APP_PASSWORD`).

**Web (`apps/web`):**
- New 5th admin hub tab **Settings** (slate theme). Inside is a "Global admin password" card with two modes:
  - **First-time setup** — single password input + Generate/Show/Hide + "Apply now" button. No email confirmation needed for the very first set.
  - **Once set** — shows the current plaintext (Show/Hide), then a change form: enter new password → "Send confirmation code to elichalfinny@gmail.com" → 6-digit code input → "Confirm and apply globally".
- Help banner appears when the server reports `emailConfigured: false`, telling the admin which env vars to set on Render.

**Operator next step (only the user can do):** to enable the email-confirmed change flow, set on the API service in Render → Environment:
- `GMAIL_USER` = `elichalfinny@gmail.com`
- `GMAIL_APP_PASSWORD` = a 16-char Google App Password (requires 2-Step Verification on the account, then https://myaccount.google.com/apppasswords → "Mail" → "Other (Custom name)" → "MinyanPays").
- *(optional)* `ADMIN_NOTIFY_EMAIL` if the confirmation should go to a different inbox than the default `elichalfinny@gmail.com`.

Until those are set, you can still rotate the global password via the Settings tab — but only by clicking Apply now (bootstrap), not the email-confirmed path.

**Location rabbi password tightened to 8-char letter+digit+special (May 10 2026, `bd489a1`).** Admin → Rabbi modal's password field was only enforcing `min(4)`. Now both server (`apps/api/src/routes/admin.ts` Zod schema for `PATCH /api/admin/settings`) and client (`apps/web/src/pages/AdminDashboard.tsx`) require **exactly 8 chars with at least one letter, one digit, and one special (!@#$%^&*+-_=?)** — matching the existing Shamosh rule. The form gained Show/Hide and Generate buttons + a help line. Deploy verified against production:

- `POST /api/auth/admin` (slug=`dovrey-evrit`, password=`Aron$11213`) → **200 OK** — admin password is unchanged and still works for Dovrey Evrit.
- `POST /api/auth/admin` (slug=`770`, password=`Aron$11213`) → **401** — `Aron$11213` belongs to `dovrey-evrit`; `770-1` has its own admin password. **If admin login is failing for the user, they are almost certainly on the `770` location in the picker — switch to "Dovrey Evrit" before clicking the admin button.**
- `PATCH /api/admin/settings` with `rabbiPassword` `abcd1234` (alphanumeric only) → **400** with the new rule message.
- `PATCH /api/admin/settings` with `ab12!` (5 chars) / `aB7$cd9!x` (9 chars) / `aB7Cd9eF` (no special) / `aBcDeFg!` (no digit) → all **400**.
- Static bundle on `minyanpays.com` ships the new `rabbiPasswordHelp` / `rabbiPasswordGenerate` strings.

Shamosh password validation already enforced this rule since `209f65f`; this commit closes the gap on the location-level rabbi password.

**Shamosh sub-menu live in production (May 9 2026, `209f65f`).** Re-implemented the multi-helper feature as a smaller, deploy-safe shape after the May 8 attempt got stuck on the Render API service:

- **Schema** (additive only, no `--accept-data-loss` needed) — new `Shamosh` model with `organizationId`, `rabbiId`, `name`, `phone?`, `email?`, `passwordHash`. Cascade-deletes with the parent rabbi. `Rabbi` still belongs to exactly one location (1 org → many rabbis → many shamoshim each).
- **Auth** (`POST /api/auth/rabbi`) — try the location's shared rabbi password first (existing behavior). On mismatch, walk the location's shamoshim and `bcrypt.compare`. Exactly one match issues a `SHAMOSH`-kind JWT carrying `shamoshId` and the parent rabbi id. Token shape gained `rabbiKind`, `shamoshId`, `shamoshRabbiId`. Multiple-match collisions refuse to pick a session.
- **Rabbi API** — `GET /api/rabbi/me` (role + capability flags), `GET /api/rabbi/passwords/generate` (server-side 8-char letter+digit+special generator), `GET /api/rabbi/rabbis` (parent-rabbi picker for the Shamosh form), `GET/POST/PATCH/DELETE /api/rabbi/shamoshim` CRUD. Router-level allowlist hard-restricts `SHAMOSH` tokens to `/me`, `/session/today`, and `/attendance/:id/confirm`; everything else (members, payouts, banner, treasury, shamosh CRUD) returns **403** for shamoshim.
- **Rabbi UI** — title is now "Rabbi / Shamosh menu". `/me` drives the layout: shamoshim see only the Today tab; per-row they see name + check-in time + green Confirm button (no address, no edit, no reject, no cancel). Rabbis get a new rose Shamoshim tab with parent-rabbi picker, name/phone/email, 8-char password input with Show/Hide/Generate, plus a list with edit/delete.
- **Admin UI** — Rabbi hub gets a "Setup Rabbi at <location>" header and a Delete button next to Add/View/Edit. Location hub gets a "Setup Rabbi" button that jumps to the rabbi hub.

**Deploy verified.** Render auto-deploy is **on** for both services. Production probes after `209f65f`:
- `/api/health` → `{ ok: true }`.
- `POST /api/auth/rabbi` with bogus credentials returns 401 (would be 500 if the Shamosh query failed against a missing column/table).
- `/api/admin/rabbis` returns both rabbis at `dovrey-evrit`.
- Static site bundle at `minyanpays.com` ships the new strings ("Shamoshim (helpers)", "Signed in as a Shamosh", "Setup Rabbi", "Rabbi / Shamosh menu").

**Migration history this chat:**
- `acadda3` (May 8) — original multi-rabbi feature; API auto-deploy failed at `prisma db push` (unique constraint without `--accept-data-loss`), static site succeeded so users got a UI talking to a stale API.
- `b12b8af` / `25c57ca` — temporary `--accept-data-loss` flag dance and revert. **Did not actually run** because Render auto-deploy events showed nothing between `acadda3` and the morning's events screenshot — it later turned out auto-deploy was always on but the build kept failing.
- `d90b013` — full revert of `acadda3` application code; **kept** the new schema. API build still failed (schema-DB drift remained).
- `2f562ee` — schema rolled back to pre-`acadda3`; API build finally went green (no schema delta).
- `209f65f` — additive Shamosh model + new endpoints + UI. Both services green.

**Reverted multi-rabbi / Shamosh feature (May 9 2026, `d90b013` — superseded by `209f65f`):** Per-rabbi/shamosh passwords were rolled back at user's request after the production save flow failed. **Root cause:** Render auto-deploy is **off** on both services — the static site shows zero deploy events between `acadda3` (May 8 7:48 PM) and now, so all subsequent pushes (`b12b8af`, `25c57ca`, `a761548`, `d90b013`) sit on GitHub but never built. Static site is on the new UI (with rabbi password fields, Shamosh tab) but API is on a pre-`acadda3` build that does not understand the new password fields, so the new admin form's "Save" silently dropped them.

The revert (`d90b013`) restores the simple org-level rabbi password flow (legacy `Organization.rabbiPasswordHash` + `RABBI_PASSWORD` env). The Prisma schema is **intentionally kept** as-is so production DB does not need another `--accept-data-loss` migration — the new `Rabbi.isMain`/`passwordHash`/`passwordPlain` columns and the `Shamosh` table just sit unused. Geocoding endpoint, shamosh menu, address city/state/zip split, and "Look up GPS from address" button are gone again with this revert.

**Pending — requires Render dashboard access (only the user can click these):**
1. **Manual Deploy** the latest commit (`d90b013`) on the **static site** (`minyan-pays-1`, the one in the screenshot).
2. **Manual Deploy** the latest commit on the **API service** (separate Render service from the static site).
3. While in **Settings → Build & Deploy** on each service, turn **Auto-Deploy → On Commit** back **On** so future `git push origin main` actually rebuilds.
4. Capture the API service's Events tab so we can confirm what commit it had been stuck on.

After those four steps, login with the simple per-org rabbi password works again. The geocode/address-split work and the multi-rabbi/Shamosh feature can be re-attempted later, with auto-deploy on, in smaller commits each verified against a real Render rebuild.

**Multi-rabbi / Shamosh feature pass (May 8 2026, REVERTED 2026-05-09):** Each Location now supports multiple rabbis (one **Main rabbi** + additional approve-only rabbis), each rabbi can manage their own **Shamoshim** (helpers) who approve check-ins from the same rabbi menu, and admin can see all rabbi/shamosh passwords (8 alphanumeric, unique across the whole org/system). Address on the Location panel is now split into street/city/state/ZIP and auto-geocodes to lat/lon via OpenStreetMap Nominatim. The "(shown to members)" wording was removed and the Phone column now lines up with Location name.

**Completion directive** (`MINYANPAYS_COMPLETION_DIRECTIVE`): ship MinyanPays only — deployment fix, secure auth, three tefillos, first-nine UX, Zelle export, member balance wallet UI, rabbi/admin polish, kiosk, demo seed, i18n. **In progress:** Tasks 1–2 landed in code; Tasks 3+ not started in this pass.

**Latest user-facing pass:** public check-in/out no longer ties member identity to the selected location (phone + PIN resolve the org); duplicate open check-ins across sites blocked; GPS-suggested location (when admins set coordinates); punch/rabbi menu back controls removed; admin hub blurb removed; Check-In / Check-Out screen titles; rabbi login copy clarifies PIN. **Member UX (May 2026):** member login phone+PIN one row; balance page no longer shows org name under “Your balance”; rabbi banner only on **`/punch/in`** and **`/punch/out`**; profile PIN Show/Hide fixed (removed `-webkit-text-security` clash); profile save section layout + extra bottom padding; profile verification SMS via **Twilio** when env vars set (otherwise clear 503/502 or dev echo). **Laptop scroll:** `html`/`body`/`#root` locked to **`100dvh`** with **`overflow: hidden`** so only **`main`** scrolls (avoids document scroll + fixed tab bar clipping long pages like Rabbi dashboard); slightly larger **`main`** bottom padding on **`sm+`**.
**Latest feature pass (attendance cancellation):** Rabbi can cancel check-ins (soft-delete) and members can cancel today's check-in; canceled records are excluded from first-nine/payout calculations and listed separately at the bottom of rabbi Today and weekly payout screens.

## What's Done

- **Multi-rabbi & Shamosh model (May 8 2026):**
  - **Schema** — `Organization` now has `locationCity` / `locationState` / `locationPostalCode`. `Rabbi` gains `isMain`, `passwordHash`, and `passwordPlain` (`@unique`, kept readable so the admin can show it back). New `Shamosh` model (`organizationId`, `rabbiId`, `name`, `phone`, `email`, `passwordHash`, `passwordPlain @unique`, cascade deletes with parent rabbi). Synced with `prisma db push --accept-data-loss` locally; **production DB also needs this push**.
  - **Auth (`/api/auth/rabbi`)** — Looks up password against `Rabbi.passwordPlain` first (returns `MAIN`/`ADDITIONAL` based on `isMain`), then `Shamosh.passwordPlain` (returns `SHAMOSH`), then falls back to the legacy per-org `rabbiPasswordHash` (returns `LEGACY`). JWT now carries `rabbiKind`, `rabbiId`, `shamoshId`. Added `requireMainRabbi`, `requireRabbiNotShamosh` middleware. Shamosh tokens are whitelisted to `/me`, `/session/today`, attendance confirm/reject/cancel, and `/settings` only.
  - **Admin API** — `GET/POST/PATCH/DELETE /api/admin/rabbis` now persist `isMain`, `passwordPlain`, `passwordHash`. Setting `isMain = true` clears it on every other rabbi at that location. Admin Shamosh CRUD at `/api/admin/shamoshim`. New `GET /api/admin/passwords/generate` (server-side unique 8-char alphanumeric generator) and `GET /api/admin/geocode` (Nominatim, 1 req/sec, in-memory 6-hour cache, distinctive User-Agent). `/api/admin/settings` accepts `locationCity`/`locationState`/`locationPostalCode` plus `autoGeocode: true` to refresh lat/lng from the merged address atomically.
  - **Rabbi API** — `GET /api/rabbi/me` reports role + capability flags. `GET/POST/PATCH/DELETE /api/rabbi/shamoshim` lets any non-shamosh rabbi manage **their own** shamoshim (`rabbiOwnedWhere`); legacy tokens see all org shamoshim.
  - **Admin UI** — Location panel layout fixed: phone field now sits in `grid-cols-2 items-start` next to Location name (so the wider Phone label no longer pushes the row apart). “(shown to members)” copy removed. Address row is now `Street` + 3-col `City / State / ZIP`; an explicit **“Look up GPS from address”** button calls `/api/admin/geocode` and pre-fills the lat/lng inputs (Save also sends `autoGeocode: true` whenever address fields changed and lat/lng were left blank). New **Rabbis at this location** card lists every rabbi with their plain password (★ marks the main rabbi). Rabbi panel now has an **isMain** checkbox + an 8-character alphanumeric password input with **Show/Hide** + **Generate** buttons (uses `/api/admin/passwords/generate`; falls back to client-side `crypto.getRandomValues` if the call fails).
  - **Rabbi UI** — Title is now **“Rabbi / Shamosh menu”** (`rabbi.title` + `rabbiLogin.title`). New **Shamoshim** tab (rose theme, 5-column nav) with add / edit / delete form, plain-password readback, Generate, Show/Hide. When the JWT is a `SHAMOSH`, all non-today tabs are hidden; the today list strips address, view/edit, reject, and cancel — leaving only the displayed **name**, **check-in time**, and a green **Confirm** button per row, matching the spec “view name of check-in and time and approve or nothing”. Banner copy in `rabbiLogin.subtitle` now mentions both rabbis and shamoshim.
  - **i18n** — New keys under `admin.*` (`addressStreet`/`addressCity`/`addressState`/`addressZip`, `geocodeAuto`, `geocodeAutoHelp`, `geocodeFailed`, `geocodeSuccess`, `rabbiPasswordHelp`, `rabbiPasswordPlaceholder`, `rabbiPasswordGenerate`, `rabbiPasswordShow`, `rabbiPasswordHide`, `rabbiIsMainLabel`, `rabbiIsMainHelp`, `rabbisAtLocationTitle`, `rabbiPasswordTaken`) and `rabbi.*` (`shamoshim*`, `shamoshAdd`, `shamoshSave`, `shamoshDelete`, `shamoshDeleteConfirm`, `shamosh*Placeholder`, `shamoshGenerate`, `shamoshShow`, `shamoshHide`, `shamoshNoneYet`, `shamoshNotAllowed`, `shamoshViewTitle`, `shamoshViewHelp`, `shamoshNoCheckIns`). English copy added; other locales fall back via `fallbackLng: 'en'`.
  - **Smoke verified locally** — embedded Postgres + dev API → `POST /api/auth/rabbi` returns `{ rabbiKind: "MAIN" }` for the main rabbi and `{ rabbiKind: "SHAMOSH" }` for the helper. Main token can hit `/api/rabbi/members` and `/api/rabbi/shamoshim` (both 200). Shamosh token gets **403** on those routes but 200 on `/api/rabbi/me` and `/api/rabbi/session/today`.
- **Local “could not load locations” fix:** Root cause was API failing on DB (`127.0.0.1:5433`) when embedded Postgres was not running, or **`npm run db:local`** failing because **`scripts/embedded-pg-serve.mjs`** always called **`initialise()`** on a non-empty **`.embedded-pg`** directory. Script now skips **`initialise()`** when **`PG_VERSION`** exists and only starts the server. Verified: **`npm run db:local`** + **`npm run dev`** → **`GET /api/public/organizations`** returns a JSON array and the org picker works.
- **Schema drift fix (local):** API crash `P2022` (`Organization.checkInOnlyPreferred` missing) caused the locations banner. Ran **`apps/api npm run db:push`** against local Postgres (`127.0.0.1:5433`); `/api/public/organizations` now returns data again.
- **Task 1 (deploy / blank page):** `OrgContext` no longer treats HTML (same-origin `/api` fallback) as JSON; detects missing **`VITE_API_BASE_URL`** in production builds and shows an amber **deploy banner** (`deployMissingApiBase` / `deployBadResponse`). **`apiBase.ts`** documents correct API host example. **`render.yaml`** comments clarify **`apps/web/dist`** publish path and add **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`** to API env template.
- **Task 2 (auth):** Admin: **`Organization.adminPasswordHash`** (bcrypt) or **bootstrap** secret (`ADMIN_BOOTSTRAP_PASSWORD` → `ADMIN_PASSWORD` → default **`11213Aron`**); JWT **`adminMustChangePassword`** until **`POST /api/admin/account/password`**; middleware blocks other admin routes until changed. Rabbi/member unchanged. JWT **`24h`**. **`timingSafeString`**, **`bootstrapAdminPassword.ts`**, web **`/admin/change-password`**, **`adminJwt.ts`**.
- **Web login UI:** **`AdminLogin`** password field; **`RabbiLogin`** password field; **`MemberLogin`** PIN field and payload. English strings + **`rabbiLogin.passwordRequired`**. **`OrgProvider`** clears **`minyan_rabbi_token`** on org change.
- **`docs/PROGRAMMER_HANDOFF.md`:** Security section updated to reflect restored credential checks (date line remains **2026-05-03** per doc convention).
- **Punch UI PIN parity fix (check-in + check-out):** `apps/web/src/components/PunchIdentityForm.tsx` now includes a PIN input inline with the phone row, validates PIN length (4+), and sends `pin` in both `/api/punch/in`, `/api/punch/out-public`, and `/api/punch/out-location-default` requests so public check-in/out match backend PIN enforcement.
- **No default autofill for phone/PIN:** `apps/web/src/pages/MemberLogin.tsx` and `apps/web/src/components/PunchIdentityForm.tsx` now force blank fields on mount and use anti-autofill attributes (`autoComplete="new-password"` + unique input names) so phone/PIN do not start prefilled from browser memory.
- **Global scroll/menu visibility fix:** `apps/web/src/App.tsx` now uses a viewport-locked shell (`h-dvh max-h-dvh overflow-hidden`) with scroll delegated to `main` (`min-h-0 overflow-y-auto`, larger bottom safe-area padding) so pages like Member Billing can scroll fully above the fixed bottom navigation.
- **Debug handoff notes added:** `docs/PROGRAMMER_HANDOFF.md` now includes `### Debugging issues` with this chat’s recurring problems (missing PIN in punch flows, autofill defaults, scroll hidden behind bottom nav) and a cross-screen regression checklist.
- **Standing policies added (Cursor):**
  - `.cursor/rules/standing-debug-policy.mdc` (always-apply rule) now enforces cross-screen/menu regression checks and requires documenting recurring bugs; includes a **numbered inventory of all minyanpays.com screens** (routes + pre-route shells) for regression targeting.
  - `.cursor/hooks.json` + `.cursor/hooks/git-reminder.ps1` now add a `beforeSubmitPrompt` reminder when changes are large/stale (10+ changed files or ~1 hour since last commit), prompting a checkpoint commit.
  - Policy is reminder-only and does **not** auto-push.
- **Documentation updated:** `docs/PROGRAMMER_HANDOFF.md` now includes `## 13. Standing Cursor policies` describing the rule/hook files and behavior.
- **Hotfix after live retest:** `apps/web/src/components/PunchIdentityForm.tsx` now renders explicit phone + PIN labeled inputs side-by-side (including mobile) so PIN cannot appear missing. `apps/web/src/api.ts` now maps Zod validation payloads (`formErrors`/`fieldErrors`) to human-readable error text instead of raw JSON blobs.
- **iPhone viewport / scroll shell:** Removed `body` safe-area padding + full-viewport inner height combo that could make the first paint **taller/wider than the visible screen** until Safari reflowed. `html`/`body`/`#root` now use a flex height chain with `overflow-x: hidden`, safe-area only on the top chrome wrapper in `App.tsx`, and `main` uses `app-scroll-main` (`-webkit-overflow-scrolling: touch`, `overscroll-behavior-y: contain`) with extra bottom padding above the fixed tab bar (`pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))]`). `index.html` viewport adds `interactive-widget=resizes-content` for mobile keyboard behavior.
- **Check-in identity + one active session:** `apps/api/src/routes/punch.ts` — `POST /in` and `POST /out-public` resolve the member by **phone + PIN** across approved members, record attendance in that member’s org (dropdown / header only disambiguate when the same phone+PIN exists at multiple orgs). **`assertNoBlockingOpenAttendance`** blocks a second open check-in for the same phone across matched accounts. Successful check-in JSON includes **`organizationSlug`** / **`synagogueName`**; web syncs org context after success.
- **GPS suggestion:** `Organization.checkInLatitude` / **`checkInLongitude`** exposed on **`GET /api/public/organizations`**, editable in admin Location setup (`PATCH /api/admin/settings`). `PunchIdentityForm` calls **`navigator.geolocation`** when any org has coordinates and pre-selects the nearest site; changing the dropdown marks manual override.
- **UX copy / chrome:** Removed **`BackLink`** from **`PunchIn`**, **`PunchOut`**, **`PunchMenu`**, **`RabbiLogin`**. Removed admin **`admin.subHub`** paragraph. i18n: punch titles **Check-In** / **Check-Out**; rabbi password label/help mentions **PIN**.
- **Member flows:** **`MemberLogin`** phone + PIN **`grid-cols-2`** like check-in. **`MemberDashboard`** drops synagogue subtitle under “Your balance”. **`App.tsx`** **`PunchOnlyRabbiBanner`** limits **`RabbiBanner`** to **`/punch/in`** and **`/punch/out`**. **`MemberProfile`** new-PIN field uses **`pillInput`** + **`type` toggle** (not **`pinInput`**, which forced disc glyphs even when “Show”); save card stack + **`pb-[calc(10rem+…)]`** on form for tab bar clearance.
- **Profile verification SMS:** **`apps/api/src/lib/smsVerification.ts`** sends via Twilio REST when **`TWILIO_ACCOUNT_SID`**, **`TWILIO_AUTH_TOKEN`**, **`TWILIO_PHONE_NUMBER`** are set; otherwise production returns **503** (no fake “sent”); dev / **`MEMBER_VERIFICATION_ECHO_CODE`** still returns **`devCode`**.
- **Desktop/laptop bottom clip:** **`apps/web/src/index.css`** — `html`/`body`/`#root` use **`height/max-height: 100dvh`** and **`overflow: hidden`** so the flex shell has a definite viewport height and **`main.app-scroll-main`** is the sole vertical scroll (fixes Rabbi/Admin long lists where the fixed **`MobileNav`** hid the last items on laptop only). **`App.tsx`** increases **`main`** **`pb-[calc(8.5rem…)]`** / **`sm:pb-[calc(9rem…)]`** for tab-bar clearance; loading shell **`min-h-0 overflow-hidden`**; org-picker **`main`** extra bottom padding for long lists / safe-area (no tab bar there).
- **Docs/rules hygiene pass:** Updated `docs/PROGRAMMER_HANDOFF.md` (Twilio status, env vars, deduped debugging section), `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` (historical note + current health response), `docs/AI_VERIFICATION_CHECKLIST.md` (removed chat-specific answer templates), `docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md` (current review goals), and `.cursor/rules/standing-debug-policy.mdc` (daily testing-mode doc review + de-dup rule). Added `docs/DOCS_INDEX.md` as the canonical docs map to keep fewer overlapping docs.
- **Attendance cancellation flow:** Added `Attendance.canceledAt/canceledByRole/canceledReason` in Prisma schema; new endpoints `POST /api/rabbi/attendance/:id/cancel` and `POST /api/me/checkin/cancel-today`; `rabbi/session/today` and weekly report now return `canceledAttendances`; earnings logic now excludes canceled records (`canceledAt: null` guards). Web updates: Rabbi Today card gets **Cancel check-in** action and bottom canceled list; Rabbi Payouts tab shows canceled list excluded from payout; Member Dashboard gets **Cancel today check-in** action.

## What's Next / Blockers

- **Render handoff items still requiring user (Render dashboard) access — re-checked May 10 2026:**
  - **Twilio env vars** on the API service (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`). Only needed for real SMS on **Member profile → Send code**; without them production returns 503 from the verification endpoint. Not blocking core check-in/admin/rabbi flows.
  - **`RABBI_PASSWORD` env var** is now optional — the legacy fallback only fires when `Organization.rabbiPasswordHash` is null. Admin → Rabbi can set/rotate the per-location password directly, so the env var can stay set as an emergency backstop or be removed entirely; either way the new admin form is the source of truth.
  - **Shell access on the API service** (add SSH public key) is no longer needed for routine deploys — the additive Shamosh schema went in via Render's automatic `prisma db push` step in `render.yaml`. Keep this as a future option only if a non-additive migration ever needs to be run by hand.
  - **Auto-deploy** is **on** for both services; pushes to `origin/main` rebuild within ~2 minutes (verified again on `bd489a1`).
- **Production DB push for the multi-rabbi schema (critical):** After deploying this branch, run `npx prisma db push --accept-data-loss` on Render (the new `passwordPlain @unique` constraints require the flag). Then the admin user has to:
  1. Open **Admin → Rabbi** and edit the existing rabbi(s) — at minimum check **Main rabbi** on one of them and click **Generate** for the password.
  2. Optionally create additional rabbis (approve-only) under the same location with their own generated passwords.
  3. The legacy per-org `rabbiPasswordHash` still works as a fallback until each rabbi has a real password, so old logins won’t break mid-deploy.
- **Geocoding caveat:** `geocodeAddress` uses public Nominatim with a `minyanpays/1.0 (...)` User-Agent and 1 req/sec gating. Update the contact email in `apps/api/src/lib/geocode.ts` (currently `contact@minyanpays.com`) before the first production geocode if a different ops mailbox is preferred. Heavy use should switch to a paid provider (Mapbox / Google) — the function is single-source so swapping is one edit.
- **Deploy source of truth (critical):** This repo has two Git remotes — **`origin`** → `github.com/NeVoTM/minyan-pays` (what **minyanpays.com / Render** typically builds from) and **`cur`** → `github.com/NeVoTM/minyan-pays-cur`. Pushing only to **`cur`** leaves production on old UI until **`git push origin main`** runs (done **2026-05-06** after “no change on web” report). **Habit:** push both, or set Render to the single repo you actually use.
- **Production DB:** After pulling these changes, run **`npx prisma db push`** (or a migration) on the deployed database so **`checkInLatitude` / `checkInLongitude`** exist; then set coordinates per site in **Admin → Location setup** for GPS hints to activate.
- **Policy decision locked:** Keep **central-admin model** for now — one admin may manage all locations (`/api/admin/organizations` global list/create accepted behavior).
- **Local dev habit:** Keep **`npm run db:local`** running in one terminal (or use your own Postgres matching **`DATABASE_URL`**) before **`npm run dev`**. If Vite says port **5173** is in use, open the URL it prints (e.g. **5174**). If **`db:local`** exits with **`postmaster.pid` already exists**, embedded Postgres is already running for that data dir — do not start a second copy; stop the existing process first if you need a clean restart.
- **Render dashboard (manual):** Set **`VITE_API_BASE_URL`** on the static service to the live API origin (e.g. `https://minyan-pays.onrender.com`), set **`ADMIN_PASSWORD`** / **`RABBI_PASSWORD`** on the API service, **redeploy both** so the browser bundle embeds the API URL and logins work. Add **Twilio** env vars on the API service so **Member profile → Send code** delivers real SMS (trial accounts may need verified destination numbers).
- **Next-session deploy step (saved):** Enable **Shell** access in Render for API service (add SSH public key), then run:
  - `cd apps/api`
  - `npx prisma db push`
  - If shell already starts in service root with Prisma schema, run just `npx prisma db push`.
  - After SSH key is added, resume here and run/verify DB push success from Render logs.
- **Local dev:** Copy **`apps/api/.env.example`** → **`.env`** and set **`ADMIN_PASSWORD`** (and rabbi fallback if needed) before admin/rabbi login.
- **Directive remainder:** Task 3 (TefillahType + UI), 4–11 per **`MINYANPAYS_COMPLETION_DIRECTIVE`** — design-system components, weekly export columns, treasury budget check, kiosk route, demo seed, full i18n for new strings.
- **Cross-tenant audit:** Confirm every protected route enforces org id + role vs JWT (directive §2).

## Notes / Context

- **Git:** Latest pushed commit is **`dc5b757`** (embedded Postgres restart guard + status notes) on **`origin/main`** and **`cur/main`**.
- **Deploy automation blocker:** No authenticated Render control path in this environment. `render` command available after install is an unrelated template-rendering CLI, not Render.com deployment CLI/API tooling.
- **Admin password:** Bootstrap default **`11213Aron`** when `Organization.adminPasswordHash` is null (override with **`ADMIN_BOOTSTRAP_PASSWORD`** or **`ADMIN_PASSWORD`**). First login must set a real password via **`/admin/change-password`** (`POST /api/admin/account/password`).
- **Password verification (local):** `POST /api/auth/admin` with `organizationSlug: "dovrey-evrit"` and `password: "11213Aron"` succeeds and returns `mustChangePassword: true`; if web shows **Invalid password**, the target environment likely has `adminPasswordHash` already set or points to a different API/build.
- **Current check:** On localhost (`:5175`) backend still accepts `11213Aron` via direct API call, so remaining mismatch is likely manual entry/input issue in the browser rather than server config.
- **Resolved locally:** Admin bootstrap login succeeded; password was changed via `/admin/change-password`, so this org now uses stored `adminPasswordHash` (bootstrap no longer valid for that org).
- **Production check (remote):** `https://minyan-pays.onrender.com/api/health` returns `{"ok":true,"service":"minyan-pays-api"}` and `https://minyan-pays.onrender.com/api/public/organizations` returns org JSON. Static site domain `https://minyanpays.com/admin` serves app HTML (status header 404 from host rewrite behavior) and needs browser login verification with the new admin password.
- **Latest live retest:** API health and organizations endpoints are still passing in production; web root (`/`) is `200`; `/admin` responds with app HTML but returns HTTP `404` header, indicating routing works visually but static-route status behavior should be normalized in Render rewrites/redirect settings.
- **Docs discrepancy noted:** `PROGRAMMER_HANDOFF.md` contains older language about auth being disabled, but current code/path has credential checks restored (admin bcrypt/bootstrap, rabbi bcrypt/fallback, member PIN bcrypt) and this should be reconciled in docs to avoid launch confusion.
- **Security hardening pass (post-review):**
  - `apps/api/src/routes/punch.ts` now enforces PIN verification (`bcrypt`) for public punch-in / punch-out identity flows (phone-only path removed).
  - `apps/api/src/env.ts` now fails startup when required env vars are missing (`DATABASE_URL`, `JWT_SECRET`, except in test mode).
  - Build validated (`npm run build --workspace apps/api`), and auth negative checks return `401` for bad admin password and bad member PIN.
- **Production user confirmation:** Login + password change succeeded at `https://minyanpays.com/admin` using updated admin password.
- **Comms prep:** Added copy-ready sections in `docs/AI_VERIFICATION_CHECKLIST.md` under `## Answer for Gemini` and `## Answer for Copilot` so external AI reviewers get consistent, up-to-date status.
- **Copilot reconciliation doc pass:** Added `## Copilot PDF reconciliation (May 2026)` to `docs/AI_VERIFICATION_CHECKLIST.md` with three buckets: Done now, Still open, and N/A/advisory (including rationale).
- **Remaining-open issues progress (in-session):**
  - Added `docs/SECURITY_ROUTE_AUDIT.md` with full route protection inventory and cross-tenant isolation review, including explicit exceptions and follow-up recommendations.
  - Fixed stale auth wording in `docs/PROGRAMMER_HANDOFF.md` (`ADMIN_PASSWORD` env behavior now accurately described).
  - Updated `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` Task 2 preface from "auth disabled" to historical note + current-state guidance.
  - Updated `docs/AI_VERIFICATION_CHECKLIST.md` reconciliation section to mark route inventory / cross-tenant artifact as completed and narrow remaining open items.
- **Next operator step:** normalize static SPA deep-link status on Render (`/admin` should return `200` with rewrite to `/index.html`), then re-test production status codes.
- **Reviewer report:** Full sprint summary for double-checking (done vs remaining vs ops) — **`docs/CLAUDE_REVIEW_REPORT.md`**.
- **Claude Code:** CLI installed globally; launch + **`claude auth login`** — **`docs/CLAUDE_CODE_SETUP.md`**. Root context — **`CLAUDE.md`**. First-run summary (same intent as interactive prompts; use if CLI not authenticated) — **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`**.
- **GitHub Copilot / Google Gemini:** How to review & test, prompts, access limits — **`docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md`**.
- **Brief checklist for other AIs (verify + test + suggest):** **`docs/AI_VERIFICATION_CHECKLIST.md`**.
- Health check returns **`{ ok: true, service: "minyan-pays-api" }`** (not `{ status: "ok" }`).
- **`lucide-react`** is not in **`apps/web/package.json`** yet — Task 8 / design system will add it.

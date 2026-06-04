# How the Slinkys “test suite” was built (reference)

**Slinkys** is a Deskpass-style **demo app** for LuxLoft716—not automated unit tests. It lets you sign in on a phone and click through flows without a backend.

Source lives on branch **`slinkys-release`** (standalone app at repo root). See also `NeVoTM/slinkys` when published as its own repo.

## 1. Demo auth (client-only “test” logins)

`src/lib/auth.ts` defines fixed accounts:

| Role | Email | Password |
|------|-------|----------|
| Stylist / member | `demo@LuxLoft716.com` | `Lux716!` |
| Team admin | `admin@LuxLoft716.com` | `Suite716!` |

- `login()` checks email/password, stores session in `localStorage`
- `ProtectedRoute` gates `/app` and `/team/app`
- Login pages expose **“Use demo credentials”** via `demoHint(role)`

No API—safe for demos, not production security.

## 2. Routes to exercise on iPhone

| Route | What to test |
|-------|----------------|
| `/` | Landing (hero, cities, stats) |
| `/search` | Suite search UI |
| `/login` | Member sign-in → `/app` |
| `/login/team` | Admin sign-in → `/team/app` |
| `/app` | Member dashboard (protected) |
| `/team/app` | Team dashboard (protected) |

## 3. GitHub Pages hosting (two targets)

**A. Own repo** (`NeVoTM/slinkys`) — `pages.yml` on `main`:

- `npm run build:pages` → base `/Slinkys/`
- URL: `https://nevotm.github.io/Slinkys/login`

**B. minyan-pays fallback** — `pages-minyan-fallback.yml` / `slinkys-pages.yml` on `slinkys-release`:

- `npm run build:pages:minyan` → base `/minyan-pays/`
- URL: `https://nevotm.github.io/minyan-pays/login`

`vite.config.ts` picks base from env:

```ts
const pagesBase =
  process.env.PAGES_REPO === 'minyan-pays' ? '/minyan-pays/' : '/Slinkys/'
```

## 4. SPA deep links

`scripts/spa-render-404.mjs` runs after `vite build` and copies `dist/index.html` → `dist/404.html` so GitHub Pages / Render serves the React app for paths like `/login` and `/search`.

## 5. Brand parity with LuxLoft716

Black `#000000`, red `#E30000`, white text, Playfair + script **716**, tagline *Elevate your craft. Own your space.*

## 6. What the cloud agent could / couldn’t do

| Step | Agent | You |
|------|-------|-----|
| App + workflows + demo auth | ✅ | — |
| Create `NeVoTM/slinkys` repo | ❌ (403) | ✅ |
| Enable **Pages → GitHub Actions** | ❌ | ✅ one click |
| Push & deploy | ✅ after repo exists | — |

Full Slinkys checklist: `docs/GITHUB_PAGES.md` on `slinkys-release`.

## LuxLoft716 marketing site (this folder)

Same Pages pattern, no demo login—public marketing only. Setup: `docs/GITHUB_PAGES_SETUP.md`.

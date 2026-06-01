# Host LuxLoft716 on GitHub Pages

Uses the **same hosting pattern as Slinkys** (`slinkys-release` branch + `actions/deploy-pages`).

## Live URL

**https://nevotm.github.io/minyan-pays/**

## One-time setup (~1 minute)

1. Open **https://github.com/NeVoTM/minyan-pays/settings/pages**
2. **Build and deployment** → **Source:** **GitHub Actions** (not “Deploy from a branch”)
3. Save

The next push to `main` (or **Actions → Deploy LuxLoft716 to GitHub Pages → Run workflow**) publishes the site.

## How it works

| Piece | Purpose |
|-------|---------|
| `npm run build:pages` | Vite build with base `/minyan-pays/` |
| `scripts/spa-render-404.mjs` | Copies `index.html` → `404.html` for deep links |
| `.github/workflows/luxloft716-pages.yml` | Build artifact + `deploy-pages` |

## Slinkys vs LuxLoft716 (same repo)

| App | Branch / path | URL path | Role |
|-----|----------------|----------|------|
| **LuxLoft716** (marketing) | `main` → `luxloft716/` | `/minyan-pays/` | Salon suite landing site |
| **Slinkys** (booking demo) | `slinkys-release` (app at repo root) | `/minyan-pays/login` | Deskpass-style demo + test logins |

Only one **GitHub Actions** Pages deployment is active per repo; the latest successful workflow wins. Use `slinkys-release` pushes for the booking demo, `main` + `luxloft716/` for marketing.

## iPhone

Open the live URL in **Safari** → Share → **Add to Home Screen**.

## Custom domain (optional)

Repo **Settings → Pages** → add domain (e.g. `luxloft716.com`) and configure DNS per GitHub’s instructions.

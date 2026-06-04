# Host LuxLoft716 on GitHub Pages

Marketing site for **LuxLoft716** only (not MinyanPays).

## Live URL

**https://nevotm.github.io/minyan-pays/**

## One-time setup (~1 minute)

1. Open **https://github.com/NeVoTM/minyan-pays/settings/pages**
2. **Build and deployment** → **Source:** **Deploy from a branch**
3. **Branch:** `gh-pages` · **Folder:** `/ (root)` → **Save**

The next push to `main` that touches `luxloft716/` auto-deploys via GitHub Actions to the `gh-pages` branch.

## How it works

| Piece | Purpose |
|-------|---------|
| `npm run build:pages` | Vite build with base `/minyan-pays/` |
| `scripts/spa-render-404.mjs` | Copies `index.html` → `404.html` for deep links |
| `.github/workflows/luxloft716-pages.yml` | Builds and publishes to `gh-pages` |

## Manual deploy

**Actions** → **Deploy LuxLoft716 to GitHub Pages** → **Run workflow**

## iPhone

Open the live URL in **Safari** → Share → **Add to Home Screen** → name it **LuxLoft716**.

## Custom domain (optional)

Repo **Settings → Pages** → add domain (e.g. `luxloft716.com`) and configure DNS per GitHub’s instructions.

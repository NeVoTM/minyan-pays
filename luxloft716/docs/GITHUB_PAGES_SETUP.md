# Host LUXE LOFT 716 on GitHub Pages

Marketing site for **LUXE LOFT 716** only (not MinyanPays).

**Handoff:** [`PROGRAMMER_HANDOFF.md`](./PROGRAMMER_HANDOFF.md)

## Live URL

**https://nevotm.github.io/minyan-pays/**

| Page | URL |
|------|-----|
| Home | https://nevotm.github.io/minyan-pays/ |
| Logo downloads | https://nevotm.github.io/minyan-pays/brand |
| Reserve | https://nevotm.github.io/minyan-pays/reserve |
| Contact | https://nevotm.github.io/minyan-pays/contact |

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
| `.github/workflows/luxloft716-pages.yml` | Builds `luxloft716/dist` → publishes to `gh-pages` |

## Manual deploy

**Actions** → **Deploy LuxLoft716 to GitHub Pages** → **Run workflow**

## iPhone

See [`IPHONE_PREVIEW.md`](./IPHONE_PREVIEW.md). Quick path: open the live URL in **Safari** → Share → **Add to Home Screen**.

## Custom domain (optional)

Repo **Settings → Pages** → add domain (e.g. `luxeloft716.com`) and configure DNS per GitHub’s instructions. Update `vite.config.ts` `base` if the path changes.

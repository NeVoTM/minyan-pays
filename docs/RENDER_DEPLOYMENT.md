# Render deployment — Slinkys / LucLoft716

## Prerequisites

1. GitHub repo **`NeVoTM/slinkys`** exists and **`main`** is pushed.
2. Render account linked to GitHub (same account/org that owns MinyanPays).

## One-time setup (Blueprint)

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
2. Connect repository **`NeVoTM/slinkys`**.
3. Render reads root **`render.yaml`** and creates static site **`slinkys`**.
4. Wait for the first build (~2–3 min).

**Default URL:** `https://slinkys.onrender.com`

## Manual static site (alternative)

If you prefer not to use Blueprint:

| Setting | Value |
|---------|--------|
| Type | Static Site |
| Repository | `NeVoTM/slinkys` |
| Branch | `main` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Rewrite | `/*` → `/index.html` |

## Custom domain (optional)

Render → **slinkys** service → **Settings** → **Custom Domains** → add e.g. `lucloft716.com` or `app.lucloft716.com`, then set DNS CNAME to Render’s target.

## Verify after deploy

- `/` — landing page (hero, cities, stats)
- `/search?location=Buffalo,%20NY` — search results (SPA deep link; requires `404.html` from build script)

## Redeploy

Push to **`main`** on GitHub; Render auto-rebuilds.

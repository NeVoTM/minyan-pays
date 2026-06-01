# View LuxLoft716 on your iPhone

## Option A — Public link (recommended)

After GitHub Pages deploys (Actions → **Deploy LuxLoft716**):

**https://nevotm.github.io/minyan-pays/**

Open in **Safari** on iPhone. Add to Home Screen for a full-screen app icon:

1. Tap **Share** (↑)
2. **Add to Home Screen**
3. Name it **LuxLoft716**

Works on cellular or Wi‑Fi—no same-network requirement.

## Option B — Same Wi‑Fi as your computer (local)

On the machine running the dev server:

```bash
cd luxloft716
npm run preview:phone
```

Note your computer’s LAN IP (e.g. `192.168.1.42`), then on iPhone Safari open:

`http://192.168.1.42:4173`

Phone and computer must be on the **same Wi‑Fi**.

## Option C — Render (production)

Create a **Static Site** on [Render](https://render.com):

- **Root directory:** `luxloft716`
- **Build:** `npm install && npm run build`
- **Publish directory:** `dist`
- Add SPA rewrite: `/*` → `/index.html`

Use the `*.onrender.com` URL or your custom domain.

## Update contact info before sharing

Edit `src/data/content.ts` (phone, email, address).

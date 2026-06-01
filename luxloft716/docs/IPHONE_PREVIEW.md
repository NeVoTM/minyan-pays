# View LuxLoft716 on your iPhone

## Option A — GitHub Pages (best permanent link)

1. Open **https://github.com/NeVoTM/minyan-pays/settings/pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Merge the `cursor/luxloft716-site-73c7` branch (or wait for the workflow on `main`)
4. After **Actions → Deploy LuxLoft716** succeeds, open:

**https://nevotm.github.io/minyan-pays/**

Open in **Safari** on iPhone. Add to Home Screen for a full-screen app icon:

1. Tap **Share** (↑)
2. **Add to Home Screen**
3. Name it **LuxLoft716**

Works on cellular or Wi‑Fi—no same-network requirement.

## Option B — Same Wi‑Fi as your computer (local, no GitHub)

On your Mac/PC (with the project folder):

```bash
cd luxloft716
npm run preview:phone
```

Find your computer’s IP (Mac: System Settings → Network; Windows: `ipconfig`). On iPhone Safari:

`http://YOUR_COMPUTER_IP:4173`

Example: `http://192.168.1.42:4173`

Phone and computer must be on the **same Wi‑Fi**.

## Option C — Cloud preview tunnel (dev only)

From the project folder, with preview running on port 4173:

```bash
npm run preview:phone
# in another terminal:
npx cloudflared tunnel --url http://127.0.0.1:4173
```

Use the `https://….trycloudflare.com` URL on your iPhone. This link is **temporary** and stops when the tunnel closes.

## Option D — Render (production)

On the machine running the dev server:

```bash
cd luxloft716
npm run preview:phone
```

Note your computer’s LAN IP (e.g. `192.168.1.42`), then on iPhone Safari open:

`http://192.168.1.42:4173`

Phone and computer must be on the **same Wi‑Fi**.

Create a **Static Site** on [Render](https://render.com):

- **Root directory:** `luxloft716`
- **Build:** `npm install && npm run build`
- **Publish directory:** `dist`
- Add SPA rewrite: `/*` → `/index.html`

Use the `*.onrender.com` URL or your custom domain.

## Update contact info before sharing

Edit `src/data/content.ts` (phone, email, address).

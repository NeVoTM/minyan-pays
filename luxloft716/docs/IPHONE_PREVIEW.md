# View LUXE LOFT 716 on your iPhone

**Handoff:** [`PROGRAMMER_HANDOFF.md`](./PROGRAMMER_HANDOFF.md)

## Option A — GitHub Pages (recommended)

See **`GITHUB_PAGES_SETUP.md`** for the one-time Pages setting.

**Live URL:** https://nevotm.github.io/minyan-pays/

**Logo downloads:** https://nevotm.github.io/minyan-pays/brand

Add to Home Screen:

1. Open URL in **Safari**
2. Tap **Share** (↑)
3. **Add to Home Screen**
4. Name it **LUXE LOFT 716**

Works on cellular or Wi‑Fi.

### Save a logo to Photos

1. Open **/brand**
2. Choose **Classic (regular X)** or **Sign style**
3. Tap **Open PNG**
4. Long-press the image → **Add to Photos**

Or paste this link in Safari (Classic logo):

`https://nevotm.github.io/minyan-pays/brand/logo-classic.png`

## Option B — Same Wi‑Fi as your computer

```bash
cd luxloft716
npm run preview:phone
```

On iPhone Safari: `http://YOUR_COMPUTER_IP:4173` (same Wi‑Fi).

## Option C — Cloud preview tunnel (temporary)

```bash
npm run preview:phone
# other terminal:
npx cloudflared tunnel --url http://127.0.0.1:4173
```

Use the `https://….trycloudflare.com` URL until the tunnel stops.

## Update contact info

Edit `src/data/content.ts` (phone, email, address). Redeploy per `GITHUB_PAGES_SETUP.md`.

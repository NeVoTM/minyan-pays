# Free public link for minyan-pays (share with anyone)

Anyone with the link can use the app **while your PC is on** and the app is running. The link is **temporary** (changes each time unless you use a paid/ngrok reserved domain). This is fine for demos and testing; for a permanent site, deploy to a host (see `SETUP.md`).

**Important:** Use a **strong** `ADMIN_PASSWORD` in `apps/api/.env`. The public URL exposes your admin login to the internet.

---

## How it works

1. Terminal A: run **`npm run dev`** (API + web).
2. Terminal B: run a **tunnel** that forwards the internet to **`http://localhost:5173`**.
3. Share the **https://…** URL the tunnel prints.

You only tunnel **5173**. The web app calls **`/api` on the same host**, and Vite **proxies** those requests to your local API — so one tunnel is enough.

---

## Option A — Cloudflare Quick Tunnel (recommended, free)

Stable HTTPS URLs like `https://random-words.trycloudflare.com`.

### Install `cloudflared` (once, Windows)

```powershell
winget install --id Cloudflare.cloudflared --accept-package-agreements
```

Close and reopen the terminal, then:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Copy the printed HTTPS URL (it ends with **trycloudflare.com**) and send it. Leave this command running.

- Docs: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)

---

## Option B — LocalTunnel (Node only, no extra install)

From the **repo root** (with `npm run dev` already running in another terminal):

```powershell
npm run tunnel
```

The terminal prints a URL (often `https://something.loca.lt`). Use that link.

**Note:** The first visit may show a "Click to continue" page (LocalTunnel limitation). If it fails, use Option A.

---

## Option C — ngrok

1. Sign up at [ngrok.com](https://ngrok.com/), install the agent, add your auth token.
2. With dev servers running:

   ```powershell
   ngrok http 5173
   ```

3. Share the **Forwarding** `https://…` URL.

---

## Checklist before sharing

- [ ] `npm run dev` is running (API + web).
- [ ] Tunnel is running and points at **5173**.
- [ ] `ADMIN_PASSWORD` in `apps/api/.env` is **not** the default `change-me`.
- [ ] You know the link **stops working** when you shut the PC or stop the tunnel.

---

## Troubleshooting

- **Blank or API errors:** Ensure **both** API and web are up (`npm run dev`), then start the tunnel.
- **CORS errors in browser console:** You should not see these if all requests use **`/api`** (relative URLs). Do not open the API on port 3001 directly in the browser for normal use.
- **Want a URL that never changes:** Use ngrok's reserved domain (paid) or deploy the app to production hosting.

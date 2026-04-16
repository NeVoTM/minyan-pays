# Open minyan-pays to test (web address)

## 1. Start the app

From the repo root (`minyan-pays`):

```powershell
cd C:\Users\17274\minyan-pays
npm run dev
```

Leave this running. You should see the **API** on port **3001** and the **web** app on **5173**.

## 2. Addresses that work

| Where you open it | Address |
|-------------------|---------|
| **This computer** | **http://localhost:5173** |
| **Phone or tablet (same Wi‑Fi as this PC)** | **http://YOUR_PC_LAN_IP:5173** |

Example: if your PC’s IPv4 is `192.168.1.184`, use:

**http://192.168.1.184:5173**

The Vite dev server is already set to listen on all interfaces (`host: true`), and `/api` is **proxied** to the API on this machine, so punch-in, admin, and member flows work from another device on your network.

### Find your PC’s LAN IP (Windows)

```powershell
ipconfig | findstr /i "IPv4"
```

Use the address of your active Wi‑Fi or Ethernet adapter (not `127.0.0.1`).

## 3. Quick checks

- **Web UI:** open the URL above → use the **bottom menu** (Home, Punch in, Log out, Member, Admin).
- **API health:** on this PC, open **http://localhost:3001/api/health** (should return JSON `ok: true`).

## 4. Public URL (share with anyone on the internet)

Step-by-step (Cloudflare, LocalTunnel, ngrok): **[PUBLIC_URL_FREE.md](./PUBLIC_URL_FREE.md)**

Quick (Node only): run `npm run dev`, then in a second terminal `npm run tunnel` from the repo root.

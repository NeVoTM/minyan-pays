# GitHub Pages — Slinkys / LucLoft716

## Live URL (after setup)

**https://nevoTM.github.io/slinkys/**

Login:
- Stylist: **https://nevoTM.github.io/slinkys/login**
- Team admin: **https://nevoTM.github.io/slinkys/login/team**

## One-time setup (~2 minutes)

The cloud agent **cannot create** the GitHub repo (token lacks `createRepository` permission). You create the empty repo once; everything else is automated.

### Step 1 — Create empty repo

1. Open [Create repo in NeVoTM org](https://github.com/organizations/NeVoTM/repositories/new)
2. Name: **`slinkys`**
3. Public
4. **Do not** add README, .gitignore, or license
5. Click **Create repository**

### Step 2 — Push code

Tell the agent **“repo is created”** and it will push, **or** run locally:

```bash
cd slinkys
git remote add origin https://github.com/NeVoTM/slinkys.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Push to `main` triggers `.github/workflows/pages.yml` automatically

First deploy takes ~1–2 minutes. Refresh **Settings → Pages** for the live URL.

## Demo login

| Role | Email | Password |
|------|-------|----------|
| Stylist | `demo@lucloft716.com` | `Luc716!` |
| Team admin | `admin@lucloft716.com` | `Suite716!` |

## iPhone

Open the login URL in **Safari**. Optional: Share → **Add to Home Screen**.

## Why the agent couldn’t do this alone

| Step | Agent | You |
|------|-------|-----|
| Write code + Pages workflow | ✅ | — |
| Create `NeVoTM/slinkys` repo | ❌ (403) | ✅ (~30 sec) |
| Enable Pages in repo settings | ❌ (needs repo) | ✅ (one click) |
| Push & auto-deploy | ✅ after repo exists | — |

After the empty repo exists, the agent can push and GitHub Actions hosts the site — no Render required.

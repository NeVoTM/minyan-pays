# One-time setup: let the agent run everything (GitHub + Render + Cursor)

*For NeVoTM / minyan-pays — dev mode, minimal friction.*

The agent can code, push, merge, deploy, and probe production **if** these permissions and secrets exist. Do this once on a laptop or iPhone; after that the agent should not ask you to “Run workflow” by hand.

---

## 1. GitHub — let the agent trigger Actions (`403` fix)

The Cloud Agent’s default token often **cannot** run `gh workflow run`. Fix with **either** A or B.

### A. Repo workflow permissions (easiest)

1. Open: https://github.com/NeVoTM/minyan-pays/settings/actions  
2. **Workflow permissions** → select **Read and write permissions**  
3. Save.

### B. Personal Access Token (PAT) for the agent (strongest)

1. Open: https://github.com/settings/tokens?type=beta (fine-grained) **or** https://github.com/settings/tokens (classic)  
2. Create token with access to repository **NeVoTM/minyan-pays**:
   - **Contents:** Read and write  
   - **Actions:** Read and write  
   - **Workflows:** Read and write (fine-grained)  
   - Classic alternative: scopes `repo` + `workflow`  
3. Copy the token once (`ghp_…` or `github_pat_…`).

**Where to paste the PAT**

- **Cursor Cloud Agent secrets** (recommended): name `GH_TOKEN` or `GITHUB_TOKEN`  
- Optional: same as GitHub Actions secret `GH_TOKEN` if a workflow must call GitHub API as you.

---

## 2. GitHub — Render API key (already started)

1. **Render:** https://dashboard.render.com → **Account Settings** → **API Keys** → Create → copy `rnd_…`  
2. **GitHub repo secret:** https://github.com/NeVoTM/minyan-pays/settings/secrets/actions  
   - Name: `RENDER_API_KEY`  
   - Value: `rnd_…`  

---

## 3. Cursor Cloud Agent secrets (so the agent calls Render without your phone)

**Do you need this?** Optional if GitHub Actions auto-deploy is enough. **Yes** if you want the Cloud Agent to run `curl` Render API, read deploy status, and fix pre-deploy from chat.

### Exact steps (iPhone or desktop)

1. Open: **https://cursor.com/dashboard/cloud-agents**  
   (Or: Cursor app → **Settings** → **Cloud Agents** → **Secrets**)
2. Find the **Secrets** tab.
3. Click **Add secret** (or **New**).
4. Add these **one at a time**:

| Secret name (exact) | Value |
|---------------------|--------|
| `RENDER_API_KEY` | Paste `rnd_…` from Render → Account Settings → API Keys |
| `GH_TOKEN` | Optional: GitHub PAT with `repo` + `workflow` |
| `RENDER_API_SERVICE_ID` | `srv-d7pbfg8sfn5c73de2q00` |
| `RENDER_POSTGRES_SERVICE_ID` | `dpg-d7p9c23rjlhs73et01g0-a` |

5. **Apply to:** leave **All repositories** (default) unless you use environment groups.
6. **Start a new Cloud Agent chat** (secrets do not reload mid-chat).

**Note:** Secrets may not show in `printenv` in the terminal; the agent still receives them for API calls. If the agent says “NOT SET”, the secret was not saved or the chat was not restarted.

### Same key in two places (recommended)

| Where | Why |
|-------|-----|
| GitHub → `RENDER_API_KEY` | Auto-deploy workflow on every `main` push |
| Cursor Cloud Agent → `RENDER_API_KEY` | Agent can query Render / deploy from chat |

---

## 4. Render dashboard — one field to check (if deploy fails `pre_deploy_failed`)

1. https://dashboard.render.com → **minyan-pays-api** → **Settings**  
2. **Pre-deploy Command** → set to `true` or **empty** → Save  

The repo workflow also PATCHes this via API when `RENDER_API_KEY` works.

---

## 5. What the agent will do automatically (no user clicks)

- Push fixes to `main`  
- `gh workflow run "Render API deploy"` (when `GH_TOKEN` works)  
- Render API: fix pre-deploy, trigger deploy, poll logs  
- `curl` https://minyan-pays.onrender.com/api/health and `/api/public/organizations`  
- Report: live / DB down / static site env wrong  

---

## 6. Account-wide Cursor rule (optional duplicate)

This repo already has **`.cursor/rules/owner-automate-first.mdc`** (`alwaysApply: true`).

To apply the same rule to **all projects** on your Cursor account:

1. Cursor → **Settings** → **Rules** → **User rules**  
2. Paste the “AUTOMATE FIRST” block from that file (or: “Follow docs/AGENT_AUTOMATION_SETUP.md; automate deploys and APIs; never ask me to Run workflow if you can gh workflow run.”)

---

## 7. Render Postgres — expired? upgrade / pay

**Agent check (June 2026):** Production API returns `"db": false` and `/api/public/organizations` → **503**. That means the API is up but **cannot reach Postgres** — consistent with an **expired or missing** free database.

Your docs noted **`minyan-pays-db`** free expiry around **2026-05-29**. Today is past that date → treat the DB as **expired or deleted** until you confirm in the dashboard.

Render free Postgres rules (official):

- Free DB **expires 30 days after creation** (newer policy; older DBs may have a custom date in the dashboard).
- **14-day grace** after expiry to upgrade before **permanent deletion**.
- [Render free tier docs](https://render.com/docs/free#free-postgres)

### Links (iPhone Safari)

| What | URL |
|------|-----|
| **Your Postgres (`minyan-pays-db`)** | https://dashboard.render.com/postgres/dpg-d7p9c23rjlhs73et01g0-a |
| **API service (set `DATABASE_URL`)** | https://dashboard.render.com/web/srv-d7pbfg8sfn5c73de2q00 |
| **Billing / add card** | https://dashboard.render.com/billing |
| **Render pricing** | https://render.com/pricing |
| **Postgres flexible plans** | https://render.com/docs/postgresql-refresh |

### Upgrade (on the Postgres page)

1. Open the Postgres link above.
2. If you see **Expired** or **Upgrade** — choose a **paid instance type** (smallest paid tier is fine for dev).
3. Add a payment method under **Billing** if Render asks.
4. Open the **API** link → **Environment** → set **`DATABASE_URL`** to the **Internal Database URL** from Postgres → Save.
5. Push to `main` or **Manual Deploy** API — locations on minyanpays.com should load when `"db": true`.

---

## Quick links (iPhone bookmarks)

| Task | URL |
|------|-----|
| GitHub Actions permissions | https://github.com/NeVoTM/minyan-pays/settings/actions |
| GitHub secrets | https://github.com/NeVoTM/minyan-pays/settings/secrets/actions |
| Run deploy workflow | https://github.com/NeVoTM/minyan-pays/actions/workflows/render-api-deploy.yml |
| Render API keys | https://dashboard.render.com (Account Settings → API Keys) |
| Render API service | https://dashboard.render.com (open minyan-pays-api) |

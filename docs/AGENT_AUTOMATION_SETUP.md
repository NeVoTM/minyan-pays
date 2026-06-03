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

## 3. Cursor Cloud Agent secrets (so the agent doesn’t need your phone)

In **Cursor** → your account / cloud agent / **Secrets** (wording may vary by Cursor version), add:

| Name | Value |
|------|--------|
| `RENDER_API_KEY` | `rnd_…` from Render |
| `GH_TOKEN` | PAT from section 1B (if workflow dispatch still 403) |
| `RENDER_API_SERVICE_ID` | `srv-d7pbfg8sfn5c73de2q00` (optional) |

After saving, start a **new** agent chat so the environment reloads secrets.

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

## Quick links (iPhone bookmarks)

| Task | URL |
|------|-----|
| GitHub Actions permissions | https://github.com/NeVoTM/minyan-pays/settings/actions |
| GitHub secrets | https://github.com/NeVoTM/minyan-pays/settings/secrets/actions |
| Run deploy workflow | https://github.com/NeVoTM/minyan-pays/actions/workflows/render-api-deploy.yml |
| Render API keys | https://dashboard.render.com (Account Settings → API Keys) |
| Render API service | https://dashboard.render.com (open minyan-pays-api) |

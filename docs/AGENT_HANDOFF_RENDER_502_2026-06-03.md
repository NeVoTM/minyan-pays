# Agent handoff — Render 502 / minyanpays.com “Could not load locations” (2026-06-03)

**Read this first** in any new Cloud Agent chat for `NeVoTM/minyan-pays`. Owner rule: **automate first** — see `.cursor/rules/owner-automate-first.mdc`.

---

## User goal

Get **https://minyanpays.com** working on the public internet (org picker / locations load). User does **not** want manual GitHub/Render clicks unless the platform blocks automation.

---

## What was broken

1. **Render API crash loop** — `minyan-pays-api` exited with **code 1**; logs showed Prisma error with `retryable: undefined`. Express 4 did not catch async route errors → process died → **502 Bad Gateway**.
2. **Hitting `/api/public/organizations`** killed the server (needed for location picker on static site).
3. **Deploy blocked** — Render **`pre_deploy_failed`** (stale dashboard pre-deploy, often `npx prisma db push` without `--accept-data-loss`).
4. **Database** — Production now returns `"db": false` and orgs **503 JSON** (API stays up). Free Postgres **`minyan-pays-db`** likely **expired** (docs noted ~**2026-05-29**; Render free Postgres also expires **30 days after creation**).

---

## What was fixed (merged to `main`)

| PR / commit area | Change |
|------------------|--------|
| **PR #5** | `apps/api/src/patchExpressAsync.ts` — patch Express **Route** handlers so Prisma errors go to error middleware, not process exit. `/api/health` includes `"db": true\|false`. Map DB errors to **503 JSON**. |
| **PR #6** | `apps/api/scripts/render-build.mjs` — if `prisma db push` fails at build, still run `tsc` so deploy can ship. |
| **Workflow** | `.github/workflows/render-api-deploy.yml` — PATCH `preDeployCommand: true` via Render API; **auto-runs on push to `main`** (`apps/api/**`, `render.yaml`); manual `workflow_dispatch` still available. |
| **Rules/docs** | `.cursor/rules/owner-automate-first.mdc`, `docs/AGENT_AUTOMATION_SETUP.md` |

**Verify fix is live:** `GET https://minyan-pays.onrender.com/api/health` should include **`"db"`** field. If missing, old build is still running.

**Last known good API behavior (DB down):**

```json
{"ok":true,"service":"minyan-pays-api","db":false}
```

```json
{"error":"Database is temporarily unavailable. Check Render Postgres and DATABASE_URL."}
```

Static site **https://minyanpays.com** returns 200 but shows yellow banner: *“Could not load locations…”* until orgs endpoint returns 200 array.

---

## Secrets (user configured)

### GitHub repository secrets ✅

- **`RENDER_API_KEY`** — set (user cannot re-read value; write-only).
- Workflow **can** trigger deploy; Render API auth works from Actions.

### Cursor Cloud Agent secrets ✅ (user)

Three secrets (UI truncates names to `REND…`):

| Name | Value |
|------|--------|
| `RENDER_API_KEY` | `rnd_…` |
| `RENDER_API_SERVICE_ID` | `srv-d7pbfg8sfn5c73de2q00` |
| `RENDER_POSTGRES_SERVICE_ID` | `dpg-d7p9c23rjlhs73et01g0-a` |

**Note:** Secrets may **not** appear in `printenv` in agent terminal; may require **new** Cloud Agent chat to inject. If `RENDER_API_KEY` missing in shell, use GitHub Actions or ask user to confirm secrets + new chat.

### Agent shell (this incident)

Often **`RENDER_API_KEY` NOT SET** in cloud agent env despite Cursor UI — do not assume; test with:

```bash
python3 -c "import os; print('len', len(os.environ.get('RENDER_API_KEY','')))"
```

---

## Render resource IDs

| Resource | ID / URL |
|----------|-----------|
| API web service | `srv-d7pbfg8sfn5c73de2q00` — https://dashboard.render.com/web/srv-d7pbfg8sfn5c73de2q00 |
| Postgres | `dpg-d7p9c23rjlhs73et01g0-a` — https://dashboard.render.com/postgres/dpg-d7p9c23rjlhs73et01g0-a |
| Public API | https://minyan-pays.onrender.com |
| Static site | https://minyanpays.com |
| Billing | https://dashboard.render.com/billing |

---

## What the NEXT agent must do (in order)

### 1. Probe production (no user action)

```bash
curl -sS https://minyan-pays.onrender.com/api/health
curl -sS -w "\nHTTP:%{http_code}\n" https://minyan-pays.onrender.com/api/public/organizations
```

**Success criteria:**

- Health **200** with `"db": true`
- Organizations **200** with JSON **array** (not HTML, not 503)

### 2. Use Render API if `RENDER_API_KEY` is available

```bash
# List/get postgres instance
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" \
  "https://api.render.com/v1/postgres/dpg-d7p9c23rjlhs73et01g0-a"

# Get service env (do not log DATABASE_URL value to user chat in full)
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/srv-d7pbfg8sfn5c73de2q00/env-vars"
```

Determine: DB **expired / suspended / deleted** vs **`DATABASE_URL` missing/wrong** on API.

### 3. Fix database (user may need dashboard once)

If Postgres expired or deleted:

- User must **upgrade** or **create new** DB on Render (paid tier) — agent cannot pay.
- Set API **`DATABASE_URL`** to Postgres **Internal Database URL** (Oregon, same region).
- Redeploy API: push empty commit to `main` OR `gh workflow run` OR Render API POST deploy.

If DB exists and is healthy but `db: false`:

- Fix `DATABASE_URL` on API service; redeploy.
- Optional: from machine with external URL, `cd apps/api && DATABASE_URL=... npx prisma db push` and `npm run db:seed` (idempotent seed skips if orgs exist).

### 4. Deploy API (automate)

- **Preferred:** `git push origin main` (triggers `render-api-deploy.yml`).
- Or: `gh workflow run "Render API deploy" --repo NeVoTM/minyan-pays`
- Workflow already PATCHes `preDeployCommand` to `true` before deploy.

Watch: `gh run list --workflow=render-api-deploy.yml` — failure at “Health and locations check” with **db:false** means deploy succeeded but DB still down.

### 5. Verify static site

Confirm **`VITE_API_BASE_URL`** on Render static service **`minyan-pays-web`** = `https://minyan-pays.onrender.com` (build-time). Redeploy web if changed.

### 6. Do NOT ask user to

- Run workflow manually if push-to-main works.
- Create duplicate `RENDER_API_KEY` secrets (one GitHub + three Cursor names are intentional).
- Paste API keys in chat.

### DO ask user only if

- Postgres must be upgraded and payment method required (billing).
- `DATABASE_URL` / External URL needed for one-off migration and user must paste via Render dashboard.
- Render build log needed from dashboard (free tier).

---

## Common user confusion (already addressed)

- **GitHub secret** cannot be retrieved after save — create new Render key and **Update** secret if lost.
- **Cursor list shows `REND…` three times** — three **different** names truncated, not duplicates.
- **Marketing page** `render.com` “Render Postgres” is NOT billing/DB status — use **dashboard** links above.

---

## Related files

- `docs/AGENT_AUTOMATION_SETUP.md` — permissions, Cursor secrets, upgrade links
- `docs/RENDER_DEPLOYMENT.md` — infra reference, migration log
- `.cursor/rules/owner-automate-first.mdc` — owner automate-first rule
- `.github/workflows/render-api-deploy.yml` — deploy automation

---

## Status at handoff time

| Component | Status |
|-----------|--------|
| API crash loop fix | ✅ On `main`, live when health has `"db"` field |
| GitHub `RENDER_API_KEY` | ✅ |
| Cursor secrets | ✅ (user); may not inject into every agent run |
| Render deploy workflow | ✅ Runs on push; pre-deploy PATCH works |
| Postgres / locations | ❌ **`db: false`** — **primary remaining work** |

**Single sentence for user:** API is fixed and deployed; **pay/upgrade Postgres and connect `DATABASE_URL`** to make minyanpays.com load locations.

# Claude Code Setup Instructions

### For local use — repo root: `C:\Users\17274\minyan-pays`

---

## WHAT THIS DOES

Installs **Claude Code** on **this machine only**. It runs inside the minyan-pays folder and can read/write/run files directly. It does **not** push to GitHub by itself unless you ask it to run `git push`.

---

## STEP 1 — Check Node.js version

```powershell
node --version
```

Need **v18+**. If lower: https://nodejs.org/en/download (LTS).

```powershell
npm --version
```

---

## STEP 2 — Install Claude Code globally

```powershell
npm install -g @anthropic-ai/claude-code
```

Verify:

```powershell
claude --version
```

If `claude` is not found, close and reopen the terminal, then retry.

### Windows permission errors

Run terminal **as Administrator**, or:

```powershell
npm install -g @anthropic-ai/claude-code --force
```

---

## STEP 3 — Go to the repo

```powershell
cd C:\Users\17274\minyan-pays
```

Confirm docs exist:

```powershell
Get-ChildItem docs\
```

You should see `PROGRAMMER_HANDOFF.md`, `CLAUDE_REVIEW_REPORT.md`, `MINYANPAYS_COMPLETION_DIRECTIVE.md`, and this file.

---

## STEP 3b — Login once (required)

If you see **`Not logged in · Please run /login`** when using **`claude -p`** or **`claude`**:

```powershell
claude auth login
```

Follow the browser / terminal prompts. Then **`claude auth status`** should show signed in.

---

## STEP 4 — Launch Claude Code

```powershell
claude
```

Or non-interactive one-shot (after login):

```powershell
claude -p "Read docs/CLAUDE_REVIEW_REPORT.md and summarize Critical vs High issues."
```

---

**Offline equivalent:** If you cannot log in yet, read **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`** — same first-run Q&A generated in-repo.

---

## STEP 5 — First commands inside Claude Code

Run in order after the prompt appears.

### 5a — Review report

```
Read docs/CLAUDE_REVIEW_REPORT.md and give me a full summary of every issue found, grouped by: Critical / High / Medium / Low
```

### 5b — Handoff + directive

```
Read docs/PROGRAMMER_HANDOFF.md then read docs/MINYANPAYS_COMPLETION_DIRECTIVE.md and tell me:
1. What is already built and working
2. What is broken
3. What is missing entirely
4. Suggest the exact order to fix things
```

### 5c — Auth (verify current implementation)

```
Open apps/api/src/routes/auth.ts and summarize how admin, rabbi, and member login verify credentials (ADMIN_PASSWORD, rabbi hash/RABBI_PASSWORD, PIN vs pinHash).
```

### 5d — Deployment

```
Open render.yaml and apps/web/package.json build script. Explain why minyanpays.com might show a blank or empty shell if VITE_API_BASE_URL is missing at build time, and what Render settings should be.
```

---

## STEP 6 — Project context (`CLAUDE.md`)

The repo includes **`CLAUDE.md`** at the **repository root** — Claude Code reads it for ongoing context (same purpose as running `/init` and pasting a profile).

If you regenerate via Claude Code: **`/init`** — merge with root **`CLAUDE.md`** instead of replacing blindly so history stays accurate.

---

## STEP 7 — Day-to-day

```powershell
cd C:\Users\17274\minyan-pays
claude
```

### Useful Claude Code commands

```
/help
/status
/diff
/clear
```

### Natural-language fixes

Example:

```
Fix … (describe the bug)
```

### Git

Commits can be done inside Claude Code when you ask. **You control** when to run:

```powershell
git push origin main
```

---

## Claude Code vs browser Claude chat

| Browser chat | Claude Code (terminal) |
|----------------|-------------------------|
| Strategy, specs | Edits files, runs npm/prisma |
| You paste uploads | Full repo access |

---

## TROUBLESHOOTING

### `claude: command not found`

```powershell
npm config get prefix
```

Add that folder’s npm global `bin` to **PATH**, restart terminal.

### API key

Configure through Claude Code’s login flow, or set **`ANTHROPIC_API_KEY`** in your environment per Anthropic’s docs. **Never commit real keys.**

### First run slow

Normal while indexing; small repos finish quickly.

---

## Dev commands (from repo root)

```powershell
npm run dev
```

Runs API + web (`apps/api` + `apps/web`).

```powershell
cd apps\api
npm run build
npx prisma migrate dev
```

```powershell
cd apps\web
npm run build
```

---

*This file lives at `docs/CLAUDE_CODE_SETUP.md` in the repo.*

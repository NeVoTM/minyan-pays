# Claude Code — quick start (this machine)

**Installed:** `@anthropic-ai/claude-code` globally (`claude --version`).

**Requirements:** Node.js 18+ (this PC: check with `node --version`).

## Launch from the repo

```powershell
cd C:\Users\17274\minyan-pays
claude
```

First run may prompt for **Anthropic login / API access** — complete that in the terminal.

If `npm install -g` failed with permissions on Windows: open **Terminal as Administrator**, or run:

```powershell
npm install -g @anthropic-ai/claude-code --force
```

## First prompts (paste into Claude Code)

1. `Read docs/CLAUDE_REVIEW_REPORT.md and give me a full summary`

2. Then:

   `Read docs/PROGRAMMER_HANDOFF.md and docs/MINYANPAYS_COMPLETION_DIRECTIVE.md then tell me what's broken, what's missing, and what's already done`

## Canonical paths in this repo

| Doc | Path |
|-----|------|
| Reviewer report | `docs/CLAUDE_REVIEW_REPORT.md` |
| Programmer handoff | `docs/PROGRAMMER_HANDOFF.md` |
| Completion directive | `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` |

## Useful commands (inside or outside Claude Code)

```powershell
cd C:\Users\17274\minyan-pays
npm run dev
```

Runs **API + web** together (`concurrently`: `apps/api` + `apps/web`).

```powershell
cd apps\api
npx prisma migrate dev
npm run build
```

```powershell
cd apps\web
npm run build
```

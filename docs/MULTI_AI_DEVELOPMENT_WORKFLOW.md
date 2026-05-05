# Multi-AI development workflow — MinyanPays (always-on)

This document sets up a **repeatable process** so **several AI assistants** (e.g. GitHub Copilot, Google Gemini, Claude, ChatGPT, Cursor Agent) can **review**, **test-plan**, **challenge assumptions**, and **suggest strategies** while you build — without conflicting instructions scattered across chats.

**Audience:** You + any AI you paste these instructions into.

---

## 1. Goals

| Goal | How this workflow helps |
|------|---------------------------|
| **Consistent review** | Same roles and prompts every sprint; less “re-explaining the project.” |
| **Multiple perspectives** | Different AIs focus on **different lanes** (security, UX/directive, QA/ops). |
| **Actionable output** | Each reviewer produces a short, comparable report you can merge into `PROJECT_STATUS.md` or tickets. |
| **Safe collaboration** | No secrets in prompts; canonical docs in-repo stay the source of truth. |

---

## 2. The three reviewer lanes (map your platforms here)

Assign **your** tools to lanes once (example — change names to match what you use):

| Lane | Focus | Example platforms (pick one per lane) |
|------|--------|--------------------------------------|
| **A — Security & API** | Auth, JWT/org consistency, Prisma queries, injection, CORS, `auth.ts`, protected routes | Copilot in IDE, or Claude Code |
| **B — Product & directive** | `MINYANPAYS_COMPLETION_DIRECTIVE.md` compliance, UX copy, i18n, rabbi/member flows | Gemini, or ChatGPT |
| **C — QA & operations** | Test plans, Render/env checklist, smoke steps, regression lists | Gemini or second Copilot session |

You can add a **fourth lane “D — Architecture / DB”** for schema migrations and cross-cutting refactors if needed.

**Rule:** Same lane should not be filled by two AIs **without** comparing outputs — either stagger (Mon A, Wed B) or merge duplicates into one summary.

---

## 3. Canonical files (every AI must be pointed here)

Keep these paths stable — they are the **contract** for external review:

| File | Role |
|------|------|
| `CLAUDE.md` | Ultra-short project context |
| `docs/PROGRAMMER_HANDOFF.md` | Architecture, stack, security summary |
| `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md` | Full sprint backlog & terminology |
| `docs/CLAUDE_REVIEW_REPORT.md` | Done vs remaining vs manual ops |
| `docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md` | Copy-paste prompts + access limits |
| `PROJECT_STATUS.md` | Where we left off (update after significant work) |

When you open **any** AI session for MinyanPays, start with:

> “Work only against the **minyan-pays** repo. Read `CLAUDE.md` then `docs/PROGRAMMER_HANDOFF.md`. Obey scope: MinyanPays only — no EffortPays/ShiurPays/reflections unless I say so.”

---

## 4. Standard prompts (rotate per session)

### 4a — Session start (any lane)

```
You are lane [A|B|C] for MinyanPays (see docs/MULTI_AI_DEVELOPMENT_WORKFLOW.md).
Repo context: read CLAUDE.md and docs/PROGRAMMER_HANDOFF.md (summarize in 5 bullets).
Today’s question: [your topic].
Constraints: do not invent env secrets; reference apps/api/.env.example for names only.
Output: (1) findings (2) risks (3) concrete next steps (4) files to open.
```

### 4b — Pre-merge / PR review

```
Review the following diff or branch intent against docs/MINYANPAYS_COMPLETION_DIRECTIVE.md.
Flag: security, iPhone 375px, directive gaps, regressions for punch/rabbi/admin.
Do not rewrite the whole app — list prioritized fixes only.
```

### 4c — Post-deploy / production smoke

```
Using docs/CLAUDE_REVIEW_REPORT.md §4 (manual ops), list a smoke-test checklist for minyanpays.com:
load, /punch, /admin, API health, and env assumptions (VITE_API_BASE_URL).
```

### 4d — Strategy / backlog grooming

```
Given docs/CLAUDE_REVIEW_REPORT.md §5 (remaining tasks), propose an implementation order for the next 2 weeks with dependencies (schema before UI, etc.).
Stay within MinyanPays scope.
```

---

## 5. Cadence (suggested — adjust to your rhythm)

| When | Who | What |
|------|-----|------|
| **Start of dev day** | You | Pull `main`; skim `PROJECT_STATUS.md`. |
| **Before a PR / merge** | Lane A + B | Quick security + directive pass on changed files. |
| **After Render deploy** | Lane C | Smoke checklist + note results in `PROJECT_STATUS.md` or `docs/reviews/` (optional). |
| **Weekly** | All three lanes | Strategy prompt **4d** + update `docs/CLAUDE_REVIEW_REPORT.md` if scope shifted. |

---

## 6. Where to store AI outputs (optional)

To avoid losing good suggestions:

- **Lightweight:** Paste summaries into **`PROJECT_STATUS.md`** → “Notes / Context” or “What’s Next.”
- **Structured:** Create dated notes under **`docs/reviews/`** (e.g. `docs/reviews/2026-05-04-gemini-security.md`). Commit if useful; **never** commit secrets.

Add `docs/reviews/.gitkeep` so the folder exists in git.

---

## 7. Access each platform needs (summary)

| Platform | Needs | Cannot do alone |
|----------|--------|------------------|
| **IDE Copilot** | Workspace = repo root; subscription | Run Render; access prod DB |
| **Gemini (web)** | Zip or pasted files (no `node_modules`, no `.env`) | Hit localhost unless you paste logs |
| **Claude / ChatGPT (web)** | Same as Gemini | Same |
| **Claude Code (CLI)** | `claude auth login`; repo path | Replace your judgement on secrets |

**Never paste:** production `DATABASE_URL`, `ADMIN_PASSWORD`, `JWT_SECRET`, API keys.

---

## 8. Keeping docs honest

After major changes:

1. Update **`PROJECT_STATUS.md`** (timestamp + done/next).
2. If backlog shifted materially, adjust **`docs/CLAUDE_REVIEW_REPORT.md`** §5–6 so external AIs don’t chase old gaps.

---

## 9. Related docs

- **`docs/COPILOT_GEMINI_REVIEW_INSTRUCTIONS.md`** — detailed Copilot/Gemini setup.
- **`docs/CLAUDE_CODE_SETUP.md`** — Claude Code CLI from repo root.
- **`docs/CLAUDE_CODE_FIRST_RUN_SUMMARY.md`** — Severity-ranked snapshot.

---

*Treat this file as the **operating manual** for multi-AI development on MinyanPays. Revise in-repo when your lane assignments or cadence change.*

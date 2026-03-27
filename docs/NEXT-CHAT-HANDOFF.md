# Handoff for next chat — Synagogue attendance / minyan software

**Last updated:** 2026-03-27  
**GitHub account email (for commits / remote):** elichalfinny@gmail.com  
**GitHub username:** [NeVoTM](https://github.com/NeVoTM)  
**Profile / display name (as on GitHub):** Eli Chalfinny (or as you set it in GitHub settings)

Use this file so a new session picks up context without re-reading the whole thread.

---

## What this project is

Software for a **rabbi/gabbai** to incentivize **minyan** attendance:

- **Quorum logic:** Pay the **first 9** attendees; **rabbi + 9 = 10** for minyan.
- **Schedule (v1):** **6 services per week** (e.g. Sun–Fri morning); later expand to multiple minyanim/day, Torah study, etc.
- **Incentives (examples from earlier spec):** Daily amount for first 9; **weekly bonus** if present all 6 days (e.g. paid to **wife** for married attendees)—amounts **configurable**.
- **Anti-cheating:** **Combination check-in** — attendee punches in with a **code**; **rabbi confirms** before it counts (pending → confirmed).
- **Punch out** required (session as an interval, not only punch-in).
- **Treasury:** **Must be funded before payouts**; if insufficient funds, **lock** the system so the rabbi is not over-committed.
- **Payments:** Prefer **automation where APIs exist** (e.g. PayPal Payouts, Stripe). **Zelle** has **no reliable public API** for bulk sends—ledger + export + manual Zelle is realistic. **Crypto** optional later (extra complexity).
- **Member view:** See **own** balance + **timestamps**; admin sees roster and payouts.

---

## Decisions already aligned

| Topic | Direction |
|--------|-----------|
| Platform | **Web first** (mobile-friendly), PWA optional; app stores later if needed |
| Admin core | Rabbi dashboard is central; consider **Refine**, **React Admin**, or **PocketBase/Directus** as shell |
| Payout frequency | **One payment per person per week** (batch), track paid/unpaid |
| Hosting | Prefer **free tier** initially |
| Design | **Basic** first; polish after it works |
| Launch | **ASAP** when MVP is ready |

---

## Repo / disk layout

| Path | Purpose |
|------|--------|
| `C:\Users\17274\synagogue-attendance-software\` | Main planning repo (Git) |
| `PLAN.md` | Detailed product/technical plan |
| `README.md` | Index |
| `docs/NEXT-CHAT-HANDOFF.md` | **This file** — session memory |
| (optional) `minyan-attendance-app` under user home | Earlier Vite scaffold if still present—may merge or replace |

---

## GitHub

- Account email: **elichalfinny@gmail.com**
- Username: **NeVoTM** → https://github.com/NeVoTM
- **After you create the repo** `synagogue-attendance-software` on GitHub (empty, no README), run:
  ```powershell
  cd C:\Users\17274\synagogue-attendance-software
  git remote add origin https://github.com/NeVoTM/synagogue-attendance-software.git
  git branch -M main
  git push -u origin main
  ```
  If `origin` already exists, use: `git remote set-url origin https://github.com/NeVoTM/synagogue-attendance-software.git`
- Local Git in this repo uses **user.email** = `elichalfinny@gmail.com` and **user.name** = `Eli Chalfinny`.

**Note:** The AI cannot see your browser or GitHub screen; paste links or errors here if something fails.

---

## Open questions for future sessions

- Exact **“on time”** rule and **cutoff** time.
- Handling **duplicates** and **voids** same day.
- **Bonus recipient** fields for married vs single (Zelle vs wallet for crypto later).
- Whether any **public** stats are OK or **admin-only** privacy.

---

## How to use this file next time

Start the chat with: *“Continue from `synagogue-attendance-software/docs/NEXT-CHAT-HANDOFF.md`”* or paste the path.

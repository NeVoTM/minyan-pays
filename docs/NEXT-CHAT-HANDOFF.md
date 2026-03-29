# Handoff for next chat — minyan-pays (Dovrey Evrit)

**Last updated:** 2026-03-27  
**Synagogue:** **Dovrey Evrit**  
**GitHub account email:** elichalfinny@gmail.com  
**GitHub username:** [NeVoTM](https://github.com/NeVoTM)  
**Repository:** **`minyan-pays`** (private) → https://github.com/NeVoTM/minyan-pays  

**GitHub Copilot summary + stack/hosting:** [COPILOT-GITHUB-SYNC.md](./COPILOT-GITHUB-SYNC.md)

Use this file so a new session picks up context without re-reading the whole thread.

---

## What this project is

Software for a **rabbi/gabbai** to incentivize **minyan** attendance at **Dovrey Evrit**:

- **Quorum logic:** Pay the **first 9** attendees; **rabbi + 9 = 10** for minyan.
- **Schedule (v1):** **6 services per week** (Sun–Fri morning); expand later.
- **Incentives (defaults from planning):** **$15/day** for first 9; **$30 weekly bonus** if **all 6 days**—amounts **configurable**.
- **Anti-cheating:** Attendee **punch-in** with code → **rabbi confirms**; **punch-out** required.
- **Treasury:** Funded before payouts; **lock** if insufficient funds.
- **Payments:** Copilot suggested **USDC/Polygon** primary + **PayPal/Zelle** backup; Cursor planning also notes Zelle API limits—reconcile at build time.
- **Member view:** Own balance + timestamps only.

---

## Decisions already aligned

| Topic | Direction |
|--------|-----------|
| Platform | Web first (mobile-friendly), PWA optional |
| Admin | Rabbi dashboard core; Refine/React Admin/PocketBase-style shells |
| Payout | One payment per person per week (batch), paid/unpaid flags |
| Hosting | Free/very low cost — **Railway / Render** (Copilot); PostgreSQL free tier |
| Stack (Copilot MVP) | **React**, **Node.js**, **PostgreSQL** |
| MVP timeline | ~**4–6 weeks** (Copilot estimate) |
| Repo | **`minyan-pays`**, **private** |

---

## Repo / disk layout

| Path | Purpose |
|------|--------|
| `C:\Users\17274\synagogue-attendance-software\` | Local clone (folder name legacy; remote is **minyan-pays**) |
| `PLAN.md` | Detailed plan |
| `docs/COPILOT-GITHUB-SYNC.md` | Copilot chat summary + your repo/synagogue answers |
| `docs/NEXT-CHAT-HANDOFF.md` | This file |

---

## Git remote

```powershell
cd C:\Users\17274\synagogue-attendance-software
git remote -v
# origin should be https://github.com/NeVoTM/minyan-pays.git
```

If you still have the old URL:

```powershell
git remote set-url origin https://github.com/NeVoTM/minyan-pays.git
```

---

## Open questions

- Exact **on time** / cutoff rules.
- **Duplicates** and **voids** same day.
- **Bonus recipient** fields (married vs single).
- **Public** stats vs **admin-only** privacy.

---

## Next session prompt

*“Continue minyan-pays for Dovrey Evrit from `synagogue-attendance-software/docs/NEXT-CHAT-HANDOFF.md`”*

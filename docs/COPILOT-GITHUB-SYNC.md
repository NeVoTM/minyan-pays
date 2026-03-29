# GitHub Copilot chat summary — merged with project decisions

**Synagogue:** **Dovrey Evrit**  
**Purpose:** Minyan attendance & payment system (free / open-source stack, minimal hosting cost)

This file captures Copilot’s suggested plan plus **your answers** so Cursor and GitHub stay aligned.

---

## Your choices (confirmed)

| Item | Value |
|------|--------|
| **GitHub repository name** | `minyan-pays` |
| **Visibility** | **Private** (originally preferred private) |
| **Synagogue name** | **Dovrey Evrit** |

---

## Copilot — key details documented

- Strategic plan & architecture
- **6-day** minyan tracking (**Sun–Fri**)
- **First 9** attendees earn **$15/day** (configurable)
- **$30 weekly bonus** when attending **all 6 days** (configurable)
- **Punch-in / punch-out** with **rabbi approval** (anti-cheating)
- **Payments (Copilot ordering):** **Crypto USDC on Polygon** as primary + **PayPal / Zelle** as backup  
  - *Note:* Our earlier Cursor plan treated Zelle as ledger/export-first; reconcile in implementation.
- **Fund management** with **system lock** when treasury is insufficient
- **Hosting:** free/very low cost — **Railway** / **Render** (and similar)
- **MVP timeline:** ~**4–6 weeks**
- **Tech stack (Copilot):** **React**, **Node.js**, **PostgreSQL**

### Copilot “next steps” checklist

- [x] Create GitHub repository (see repo name `minyan-pays` above)
- [ ] Project structure (`frontend` / `backend` or monorepo)
- [ ] Database schema
- [ ] API specification
- [ ] Task tracker / GitHub Issues milestones

---

## Free / OSS alignment

- Prefer **open-source** languages and frameworks; avoid paid-only dependencies where possible.
- Hosting: **free tiers** (Render/Railway/etc.) with awareness of **sleep/cold start** limits on free plans.
- **PostgreSQL** on free tier: often via Render/Railway/Neon/Supabase — pick one when scaffolding.

---

## Shalom

Copilot sign-off preserved: good luck with the build; reference this doc or search “minyan” in chat history.

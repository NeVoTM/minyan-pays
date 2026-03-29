# Synagogue Minyan Attendance & Incentive Software — Planning Doc

**Synagogue:** Dovrey Evrit · **GitHub repo:** [minyan-pays](https://github.com/NeVoTM/minyan-pays) (private)  
*Saved for continued work; last updated: 2026-03-27*

**Copilot alignment:** [docs/COPILOT-GITHUB-SYNC.md](./docs/COPILOT-GITHUB-SYNC.md)

## Purpose

Software for a rabbi/gabbai to run a **minyan attendance incentive program** (for **Dovrey Evrit**): track who arrived on time, pay the **first 9** attendees (quorum: rabbi + 9 = 10), optional **weekly bonus** (e.g. full Sun–Fri week, paid to designated recipient such as spouse), with **treasury gating** so the rabbi is never committed without funds.

---

## Goals

- **Credibility:** Clear, transparent rules; fair ordering; audit trail.
- **Low friction:** Seconds at the door, not spreadsheet chaos.
- **Marketing:** Trustworthy program people talk about—without feeling surveilled.

---

## Recommended direction (high level)

| Layer | Role |
|--------|------|
| **Admin (rabbi / gabbai)** | Record arrivals in order; confirm check-ins; see first-9; export who is owed what; mark payouts. |
| **Member** | See **only their own** balance and timestamps (e.g. phone + PIN). |
| **Money** | Treat the app as a **ledger + checklist**; integrate real payouts only where APIs exist (see Payments). |

**Form factor:** **Responsive web app** (phone-first), PWA optional—one link, no app store for v1.

---

## Open-source admin shells (core to build on)

No off-the-shelf product does minyan + first-9 + rabbi confirm + treasury lock + Zelle end-to-end. Use a **shell** and own the business logic.

| Option | Notes |
|--------|--------|
| **Refine** (React) | Admin-style apps, auth, tables; good with custom minyan flows. |
| **React Admin** | CRUD-heavy admin; fits resource-shaped APIs. |
| **AdminJS** | Auto admin on Node + DB; fast internal use. |
| **Directus / Strapi / PocketBase** | DB + API + admin + auth in one; still build check-in / punch / treasury custom. |

**Practical pick:** **Refine or React Admin**, or **PocketBase/Directus**, plus **custom pages** for ordered arrival, first-9, rabbi confirm, punch-out, weekly rollup.

---

## Check-in workflow (anti-cheating)

**Combination** approach; **not** honor-system only.

1. **Attendee** enters a **personal code** (or QR encoding the same) → **pending** arrival with timestamp.
2. **Rabbi/gabbai** reviews queue: **Confirm** / **Reject** (wrong person, late, duplicate).
3. Only **confirmed** records count toward **first 9** and **weekly attendance** eligibility.
4. Optional: grace window so stale punches don’t linger.

---

## Minyan & schedule assumptions (from stakeholder answers)

- **Quorum framing:** Pay **9 people**; **rabbi + 9 = 10** for minyan.
- **Scope for now:** **6 minyanim per week** (e.g. Sun–Fri morning); **expand later** to multiple minyanim per day, Torah study, etc.
- **Daily:** Morning davening ~30–45 minutes.

---

## Payments: what “automation” really means

| Rail | Reality |
|------|--------|
| **Zelle** | **No stable public API** for apps to push to arbitrary users at scale. Automate **ledger + export**; actual sends often **manual** or bank-specific tools. |
| **PayPal** | **Payouts API** exists (business onboarding, compliance). Fits **one payment per person per week** batch. |
| **Stripe / bank** | Strong APIs; not Zelle; depends on entity and country. |
| **Crypto** | Technically possible (e.g. stablecoins); adds custody, wrong-address risk, fees, reporting—**optional phase** after USD flow works. |

**Target ops model:** **One consolidated weekly payment per person** (plus clear paid/unpaid flags), not dozens of ad-hoc sends.

**README one-liner:**

> Attendance is self-initiated with a code; **only rabbi-confirmed** punches count; payouts run **only when the treasury is funded**; the system **never promises Zelle API automation**—it promises **accurate totals and audit logs**.

---

## Treasury lock (protect the rabbi)

- Maintain a **treasury balance** (USD; optional separate crypto sub-ledger later).
- Before any payout batch: **required payout ≤ available balance** (plus fee buffer).
- If **not funded:** **lock**—e.g. read-only attendance, **no** finalizing confirmations or **no** payout batch (configure strictly).
- Log **deposits** when money actually clears.

---

## Punch out

Sessions are **intervals**, not only a point in time:

- **Punch in** → pending → **rabbi confirms**.
- **Punch out** at end (or end-of-window auto-close).
- Policy can later tie “full attendance” to duration; MVP may require both punches for “present” or use punch-out for audit only.

---

## Stakeholder constraints

- **Launch:** ASAP.
- **Hosting:** Prefer **free tier** (e.g. Supabase/Firebase/PocketBase cloud + static front).
- **Design:** **Basic functional first**; professional design once operational.

---

## GitHub Copilot–style suggestions worth keeping

- Web first; mobile app later if needed.
- Repo should include: **requirements**, **wireframes**, **data model**, **issues/milestones**, **local dev instructions**.
- **Admin dashboard** is the core UX for the rabbi.

---

## Phased roadmap

1. **Phase A — Rules + treasury lock:** Sessions, punch/confirm, first-9, punch-out, weekly summary, CSV export, insufficient-funds lock.
2. **Phase B — One automated rail:** PayPal Payouts or Stripe (entity-dependent), still treasury-gated.
3. **Phase C — Multi-minyan / Torah sessions** (expand beyond 6/week model).
4. **Phase D — Crypto** (optional bucket, same gating rules).

---

## Open questions to resolve next session

- Exact **“on time”** definition and **cutoff** time.
- **Duplicate** same-day handling and **void/correction** UX.
- **Married vs single:** bonus recipient fields (name + Zelle or wallet).
- **Privacy:** public stats vs admin-only.

---

## Related local folder

Implementation experiments may live alongside in `minyan-attendance-app` or merge into this repo over time—keep one **source of truth** for product rules in this document or `docs/`.

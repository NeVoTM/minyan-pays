# First-run review (equivalent to Claude Code steps 5a–5b)

*Generated in-repo because `claude -p` requires `claude auth login` on this machine (`Not logged in · Please run /login`). After you run **`claude auth login`** once, you can run the prompts in `docs/CLAUDE_CODE_SETUP.md` locally.*

---

## 1) Executive summary

| Area | State |
|------|--------|
| **Done in code** | Task **1** (deploy UX: `VITE_API_BASE_URL` detection, org fetch hardening, banners; `render.yaml` + `404` build); Task **2** (admin/rabbi/member credential checks; JWT **24h**; login UI; `timingSafeString`). |
| **Ops (not in git)** | Set **`VITE_API_BASE_URL`** on Render static site and **redeploy**; set **`ADMIN_PASSWORD`**, **`RABBI_PASSWORD`**, **`WEB_ORIGIN`**, **`JWT_SECRET`**, **`DATABASE_URL`** on API; smoke-test production. |
| **Remaining product work** | Directive **Tasks 3–11**: three tefillos + migrations, first-nine UX, weekly Zelle CSV + treasury budget gate + mark paid, member balance wallet UI, rabbi polish + banner, mobile/kiosk + **lucide-react**, admin CSV + demo seed, empty/error states, i18n parity, full design-system pass. |
| **Security follow-up** | **Cross-tenant audit**: confirm every protected route matches JWT **`organizationId`** to resource org (directive §2). |

---

## 2) Issues by severity (from `CLAUDE_REVIEW_REPORT.md` + directive gap analysis)

### Critical (ship / security / production)

1. **Production static bundle** — If **`VITE_API_BASE_URL`** was not set at **build** time, the SPA calls same-origin `/api` and gets HTML; org list fails until env + **redeploy**.  
2. **Secrets on API** — **`ADMIN_PASSWORD`** (and rabbi fallback **`RABBI_PASSWORD`** when no org hash) must be set in Render; otherwise logins return **401**.  
3. **Cross-tenant** — Not fully audited route-by-route; risk if any handler trusts slug/header without matching JWT org.

### High (product incomplete vs directive)

4. **Three tefillos** — Not in schema/UI as separate **`MinyanSession`** types; rabbi cannot quick-create Shacharis/Mincha/Maariv per directive.  
5. **Weekly payout / treasury** — CSV shape, budget check before confirm, mark-week-paid — largely **not done** per review report.  
6. **Kiosk `/punch/kiosk`** — Not implemented.

### Medium

7. **First nine** — Logic may exist in API; directive UX (slot display, rabbi row) not fully shipped.  
8. **Member balance “wallet”** — Needs directive layout + paid badges.  
9. **Empty/error states** — Task 10 missing.  
10. **Mobile design system** — Shared button/card components, **lucide-react**, strict 375px pass incomplete.

### Low

11. **Directive doc vs code** — `MINYANPAYS_COMPLETION_DIRECTIVE.md` Task 2 still describes auth as “disabled”; **code has moved on** — trust **`PROGRAMMER_HANDOFF.md`** and **`auth.ts`**.  
12. **Health check shape** — API returns **`{ ok: true, service }`**, not `{ status: "ok" }`.

---

## 3) Working vs broken vs missing

**Working (expected locally when DB + env configured)**  
Monorepo **`npm run dev`**; Express API + Vite web; Prisma; punch/register/member/rabbi/admin routes as built before; auth endpoints enforce passwords/PIN after recent commits.

**Broken / fragile in production unless ops fixed**  
“Blank” or empty shell on **minyanpays.com** when **`VITE_API_BASE_URL`** missing from build; API cold start on free tier; CORS if **`WEB_ORIGIN`** omits real browser origins.

**Missing vs completion directive**  
Tasks **3–11** bulk (tefillos, first-nine UX, Zelle export + treasury gate, balance screen, rabbi polish, kiosk, admin CSV, demo seed, error states, full i18n, design system).

---

## 4) Suggested fix order (matches directive + dependencies)

1. **Render:** **`VITE_API_BASE_URL`** + redeploy static; API env secrets + **`WEB_ORIGIN`**; smoke test (/, `/punch`, `/admin`).  
2. **Schema + API:** **`TefillahType`** + **`MinyanSession`** migration; adjust session creation/list APIs.  
3. **Rabbi UI:** Today-first + three session buttons; attendance labels.  
4. **First nine:** Confirm **`earnings.ts`** + member/rabbi surfaces.  
5. **Payouts:** Weekly CSV columns; treasury lock banner; budget check; mark paid; member paid UI.  
6. **Member balance** wallet layout + Zelle reminder.  
7. **Kiosk** route + keypad UX.  
8. **Admin:** Org form consolidation; CSV import; **`seed-demo.ts`**.  
9. **Design system** + **lucide-react** + Task **10** empty/error + Task **11** i18n.  
10. **Cross-tenant** middleware audit.

---

## 5) One command for you (interactive Claude Code)

```powershell
cd C:\Users\17274\minyan-pays
claude auth login
claude
```

Then paste prompts from **`docs/CLAUDE_CODE_SETUP.md`** § Step 5.

---

*Sources: `docs/CLAUDE_REVIEW_REPORT.md`, `docs/PROGRAMMER_HANDOFF.md`, `docs/MINYANPAYS_COMPLETION_DIRECTIVE.md`, `CLAUDE.md`, `PROJECT_STATUS.md`.*

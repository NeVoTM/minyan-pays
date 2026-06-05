# LUXE LOFT 716 — Programmer handoff

*Last updated: 2026-06-04*

Marketing site only (`luxloft716/`). **Not** the MinyanPays attendance app (`apps/web`, `apps/api`).

**Say to the AI:** *“Read `luxloft716/docs/PROGRAMMER_HANDOFF.md` and continue the LUXE LOFT 716 site.”*

---

## Live site

| Item | Value |
|------|--------|
| **URL** | https://nevotm.github.io/minyan-pays/ |
| **Repo** | https://github.com/NeVoTM/minyan-pays |
| **Branch** | `main` |
| **Deploy** | Push changes under `luxloft716/` → GitHub Actions → `gh-pages` branch |
| **Workflow** | `.github/workflows/luxloft716-pages.yml` |
| **Pages setup** | Settings → Pages → **Deploy from branch** → `gh-pages` / root |

See also: `luxloft716/docs/GITHUB_PAGES_SETUP.md`, `luxloft716/docs/IPHONE_PREVIEW.md`.

---

## Brand (canonical)

| Field | Value |
|-------|--------|
| Name | **LUXE LOFT 716** |
| Tagline | Salon Suites |
| Phone | (716) 421-1210 |
| Email | LuxELoft716@gmail.com |
| Address | 3887 Seneca St, Buffalo, NY 14224 |

All user-facing copy and contact links: **`luxloft716/src/data/content.ts`**.

---

## Stack

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router
- Static SPA — no backend in this folder
- GitHub Pages base path: `/minyan-pays/` (`vite.config.ts` + `npm run build:pages`)

---

## Pages & routes

| Path | Screen |
|------|--------|
| `/` | Home (hero, features, gallery, promos) |
| `/amenities` | Amenities list + image |
| `/why-us` | Why Us |
| `/what-is-a-salon-suite` | Salon suite explainer |
| `/professionals` | Suite Available cards (placeholder tenants) |
| `/reserve` | Reserve a unit + inquiry form |
| `/brand` | **Logo** — download Sign vs Classic logos |
| `/contact` | Schedule a tour + inquiry form |

Nav tabs (header + footer Explore): defined in `NAV_LINKS` in `content.ts` (includes **Logo**).

---

## Key files

| Path | Purpose |
|------|---------|
| `src/data/content.ts` | Brand, nav, amenities, images, logo variants, suite listings |
| `src/components/Logo.tsx` | Site-wide logo `<img>` (`logo.png`) |
| `src/components/InquiryForm.tsx` | Shared Reserve + Contact forms |
| `src/lib/formSubmitReturnUrl.ts` | FormSubmit redirect URL builder |
| `src/lib/assets.ts` | `asset()` helper for GitHub Pages base path |
| `public/logo.png` | **Sign style** logo (live header/footer/favicon) |
| `public/brand/logo-classic.png` | **Classic (regular X)** — previous lockup |
| `public/brand/logo-sign.png` | Copy of sign PNG for `/brand` downloads |
| `public/brand/logo-classic.svg` | Vector classic lockup |
| `public/images/*` | Bundled salon photos (Pexels, local) |

---

## Forms (Reserve + Contact)

- **Provider:** [FormSubmit.co](https://formsubmit.co) → delivers to `LuxELoft716@gmail.com`
- **Method:** Native HTML `POST` to `https://formsubmit.co/{email}` with `_next` redirect (not the `/ajax/` endpoint — that path was unreliable). Return URLs use `?submitted=reserve` or `?submitted=tour`.
- **Success UI:** Green confirmation panel after redirect; form data cleared.
- **Contact message field:** Pre-filled default `"I'd like to schedule a tour"` (real value, not placeholder) — selects all on focus for quick mobile edits.

**Operator setup (one-time):** First submission to a new FormSubmit address sends an **activation email** to `LuxELoft716@gmail.com` — must click activate or deliveries fail.

---

## Logos

| Variant | File | On website? |
|---------|------|-------------|
| **Sign style** | `public/logo.png` | Yes (header, hero, footer, favicon) |
| **Classic (regular X)** | `public/brand/logo-classic.png` + `.svg` | Download only on `/brand` |

To switch the whole site to Classic: replace `public/logo.png` (or point `LOGO_IMAGE` / `Logo.tsx` at classic asset) and redeploy.

**iPhone save:** `/brand` → pick version → **Open PNG** → long-press → Add to Photos.

**Direct links:**

- Sign PNG: https://nevotm.github.io/minyan-pays/logo.png  
- Classic PNG: https://nevotm.github.io/minyan-pays/brand/logo-classic.png  

---

## Images

- Salon photos live under `public/images/` (not hotlinked Unsplash on production).
- Feature cards use salon-specific shots (`feature-spacious.jpg`, `feature-luxurious.jpg`, `feature-clean.jpg`).
- Gallery: `gallery-1.jpg` … `gallery-6.jpg`.

---

## Local dev

```bash
cd luxloft716
npm install
npm run dev          # http://localhost:5173
npm run build:pages  # production build with /minyan-pays/ base
npm run preview      # preview dist/
```

---

## Deploy checklist

1. Edit `luxloft716/` on `main`.
2. `npm run build:pages` in `luxloft716/` (CI does this automatically).
3. `git push origin main`.
4. Wait ~1–3 min; confirm https://nevotm.github.io/minyan-pays/ loads.
5. Hard-refresh or cache-bust if assets look stale.

---

## Related repo folders (do not confuse)

| Folder | Product |
|--------|---------|
| `luxloft716/` | **This marketing site** |
| `apps/web` + `apps/api` | MinyanPays attendance (Render, minyanpays.com) |
| `slinkys-release` branch | Slinkys demo app (separate Pages workflow) |

MinyanPays handoff: `docs/PROGRAMMER_HANDOFF.md`, `docs/HANDOFF_NEXT_SESSION.md`.

---

## Recent session work (2026-06)

- Local salon images; feature card photos fixed for salon (not retail).
- Logo image site-wide; two logo variants on `/brand`.
- Email → `LuxELoft716@gmail.com`.
- FormSubmit with redirect confirmation (replaced broken AJAX / mailto).
- **Logo** added to main navigation.

---

## Next tasks (optional)

- [ ] FormSubmit: confirm `LuxELoft716@gmail.com` activated.
- [ ] Replace `SUITE_LISTINGS` with real tenant names/photos when available.
- [ ] Custom domain for marketing site (e.g. luxeloft716.com) in GitHub Pages settings.
- [ ] Building exterior photo on hero/location if owner supplies asset.
- [ ] Switch site logo to Classic variant if preferred over Sign style.

---

*End of LUXE LOFT 716 handoff.*

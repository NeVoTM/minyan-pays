# LUXE LOFT 716

Marketing website for **LUXE LOFT 716** salon suites — 3887 Seneca St, Buffalo, NY.

**Live:** https://nevotm.github.io/minyan-pays/

**Handoff (start here for AI / developers):** [`docs/PROGRAMMER_HANDOFF.md`](./docs/PROGRAMMER_HANDOFF.md)

## Stack

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build        # local base /
npm run build:pages  # GitHub Pages base /minyan-pays/
npm run preview
```

## Deploy (GitHub Pages)

1. **Settings → Pages → Deploy from branch → `gh-pages` / root** — see [`docs/GITHUB_PAGES_SETUP.md`](./docs/GITHUB_PAGES_SETUP.md)
2. Push to `main` (changes under `luxloft716/`) — workflow deploys automatically

## Customize content

Edit **`src/data/content.ts`**:

- Phone, email, address
- `GALLERY_IMAGES`, `SITE_IMAGES`, `FEATURES`
- `SUITE_LISTINGS` on Professionals page
- `LOGO_VARIANTS` on `/brand` page

## Forms

Reserve (`/reserve`) and Contact (`/contact`) post to **FormSubmit** → `LuxELoft716@gmail.com`, then redirect back with a success message. First-time setup requires activating that inbox via FormSubmit’s verification email.

## Pages

| Path | Page |
|------|------|
| `/` | Home |
| `/amenities` | Amenities |
| `/why-us` | Why Us |
| `/what-is-a-salon-suite` | What Is A Salon Suite |
| `/professionals` | Professionals / suites available |
| `/reserve` | Reserve a unit |
| `/brand` | Logo downloads (Sign + Classic) |
| `/contact` | Schedule a tour |

## License

Private — LUXE LOFT 716.

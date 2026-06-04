# LUXE LOFT 716

Marketing website for **LUXE LOFT 716** — salon suites at 3887 Seneca St, Buffalo, NY.

Inspired by the structure and content flow of [The Luxe Salon Suites](https://www.theluxesalonsuites.com/) (third-party reference site), rebranded exclusively as **LuxLoft716** for Buffalo-area positioning.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

Static output is in `dist/`.

### GitHub Pages (recommended)

1. Enable Pages: **Settings → Pages → Deploy from branch → `gh-pages` / root**  
   (Details: `docs/GITHUB_PAGES_SETUP.md`)
2. Push to `main` — Actions deploys automatically.

**Live site:** https://nevotm.github.io/minyan-pays/ (enable Pages: `gh-pages` branch or GitHub Actions)

## Customize before launch

Edit **`src/data/content.ts`**:

- `phone` / `phoneHref` — real (716) number
- `email` / `emailDisplay` — e.g. `Hello@LuxLoft716.com`
- `location` — full street address
- `GALLERY_IMAGES` — replace Unsplash URLs with your suite photos
- `ProfessionalsPage` — add real tenant listings

Forms use `mailto:` links; connect Formspree, Resend, or a small API later if you prefer server-side delivery.

## Pages

| Path | Page |
|------|------|
| `/` | Home |
| `/amenities` | Amenities |
| `/why-us` | Why Us |
| `/what-is-a-salon-suite` | What Is A Salon Suite |
| `/professionals` | Professionals directory |
| `/reserve` | Reserve a unit |
| `/contact` | Schedule a tour / contact |

## License

Private — LUXE LOFT 716.

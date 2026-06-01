# Slinkys — LucLoft716

Deskpass-style on-demand salon suite booking for **LucLoft716** beauty professionals in Western New York (716).

## Brand

| Token | Value |
|-------|-------|
| Background | `#000000` |
| Primary accent | `#E30000` |
| Text | `#FFFFFF` |
| Muted | `#A3A3A3` |

**Tagline:** *Elevate your craft. Own your space.*

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Lucide React icons

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Publish to GitHub

The project is ready to push. From this directory, with `gh` authenticated and **repo create** scope:

```bash
./scripts/create-github-repo.sh NeVoTM
```

Or create [github.com/new](https://github.com/new) named `slinkys`, then:

```bash
git remote add origin https://github.com/YOUR_USER/slinkys.git
git push -u origin main
```

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (Deskpass-inspired hero, city grid, stats, product tiers) |
| `/search` | Suite search results with filters |

## Inspired by

[Deskpass](https://www.deskpass.com) — on-demand coworking. Slinkys adapts the model for salon suites: hourly booth rental, team access, and instant booking across the Buffalo metro.

## License

Private — LucLoft716 / Slinkys

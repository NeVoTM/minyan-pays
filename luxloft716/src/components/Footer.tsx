import { Link } from 'react-router-dom'
import { BRAND, NAV_LINKS } from '../data/content'

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 lg:px-6">
        <div>
          <p className="font-display text-2xl font-semibold">
            Lux<span className="text-gold">Loft</span>
            <span className="text-gold">716</span>
          </p>
          <p className="mt-3 text-sm text-white/70">{BRAND.tagline}</p>
          <p className="mt-2 text-sm text-white/70">{BRAND.location}</p>
        </div>

        <nav>
          <p className="mb-3 text-xs font-semibold tracking-widest text-gold uppercase">Explore</p>
          <ul className="space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/80 hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-gold uppercase">Contact</p>
          <p className="text-sm text-white/80">
            <a href={BRAND.phoneHref} className="hover:text-gold">
              {BRAND.phone}
            </a>
          </p>
          <p className="mt-2 text-sm text-white/80">
            <a href={`mailto:${BRAND.email}`} className="hover:text-gold">
              {BRAND.email}
            </a>
          </p>
          <p className="mt-4 text-sm text-white/60">
            Limited suites available. Schedule a tour to reserve your space.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import { BRAND, NAV_LINKS } from '../data/content'
import { BrandIcon } from './BrandIcon'
import { LuxLoft716HeroLogo } from './Logo'
import { SectionLabel } from './SectionLabel'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-lux-black">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="flex flex-col items-center text-center">
          <LuxLoft716HeroLogo className="mx-auto max-w-[280px]" />
          <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-lux-red uppercase">{BRAND.slogan}</p>
          <BrandIcon className="mt-6 h-14 w-14" />
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          <div>
            <SectionLabel className="justify-start md:justify-center">{BRAND.tagline}</SectionLabel>
            <p className="mt-4 text-sm text-lux-muted md:text-center">{BRAND.location}</p>
          </div>

          <nav>
            <p className="mb-3 text-xs font-semibold tracking-widest text-lux-red uppercase">Explore</p>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/80 hover:text-lux-red-bright">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-lux-red uppercase">Contact</p>
            <p className="text-sm text-white/80">
              <a href={BRAND.phoneHref} className="hover:text-lux-red-bright">
                {BRAND.phone}
              </a>
            </p>
            <p className="mt-2 text-sm text-white/80">
            <a href={`mailto:${BRAND.email}`} className="hover:text-lux-red-bright">
              {BRAND.emailDisplay}
            </a>
            </p>
            <p className="mt-4 text-sm text-lux-muted">
              Limited suites available. Schedule a tour to reserve your space.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-lux-muted">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  )
}

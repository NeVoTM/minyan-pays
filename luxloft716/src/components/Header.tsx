import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BRAND, NAV_LINKS } from '../data/content'
import { Button } from './Button'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link to="/" className="group flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            Lux<span className="text-gold">Loft</span>
          </span>
          <span className="text-xs font-semibold tracking-[0.35em] text-gold-dark uppercase">716</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-gold-dark' : 'text-ink/80 hover:text-ink'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button to="/contact" variant="secondary">
            Schedule A Tour
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-ink lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/10 px-4 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className="block py-1 text-base font-medium"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <Button to="/contact" variant="secondary" className="w-full">
                Schedule A Tour
              </Button>
            </li>
          </ul>
        </nav>
      )}

      <a
        href={BRAND.phoneHref}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-ink shadow-lg lg:hidden"
      >
        Call {BRAND.phone}
      </a>
    </header>
  )
}

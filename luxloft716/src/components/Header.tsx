import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BRAND, NAV_LINKS } from '../data/content'
import { Button } from './Button'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-lux-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <NavLink to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo variant="compact" />
        </NavLink>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-lux-red-bright' : 'text-white/75 hover:text-white'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button to="/contact" variant="primary">
            Schedule A Tour
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-lux-surface px-4 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `block py-1 text-base font-medium ${isActive ? 'text-lux-red' : 'text-white/90'}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <Button to="/contact" variant="primary" className="w-full">
                Schedule A Tour
              </Button>
            </li>
          </ul>
        </nav>
      )}

      <a
        href={BRAND.phoneHref}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-lux-red px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-lux-red/30 lg:hidden"
      >
        Call {BRAND.phone}
      </a>
    </header>
  )
}

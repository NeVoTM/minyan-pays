import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Logo } from './Logo'

const navLinks = [
  { label: 'Find a Suite', href: '/search' },
  { label: 'Instant Suite', href: '#instant-suite' },
  { label: 'Suite Teams', href: '#suite-teams' },
  { label: 'How It Works', href: '#how-it-works' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-muted transition hover:text-brand-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-white transition hover:border-brand-red"
          >
            Sign in
          </Link>
          <Link
            to="/login/team"
            className="rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark"
          >
            Manage Team Access
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-brand-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-brand-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="rounded-full border border-brand-border px-4 py-3 text-center text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/login/team"
              className="rounded-full bg-brand-red px-4 py-3 text-center text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              Manage Team Access
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

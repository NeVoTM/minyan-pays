import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-brand-border px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-muted">
              On-demand salon suites for beauty professionals across Western New York.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
              Elevate your craft. Own your space.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-white">
                Product
              </p>
              <ul className="flex flex-col gap-2 text-sm text-brand-muted">
                <li>
                  <Link to="/search" className="hover:text-brand-white">
                    Find a Suite
                  </Link>
                </li>
                <li>
                  <a href="#instant-suite" className="hover:text-brand-white">
                    Instant Suite
                  </a>
                </li>
                <li>
                  <a href="#suite-teams" className="hover:text-brand-white">
                    Suite Teams
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-white">
                Company
              </p>
              <ul className="flex flex-col gap-2 text-sm text-brand-muted">
                <li>
                  <a href="#how-it-works" className="hover:text-brand-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-brand-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@lucloft716.com" className="hover:text-brand-white">
                    hello@lucloft716.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-white">
                Legal
              </p>
              <ul className="flex flex-col gap-2 text-sm text-brand-muted">
                <li>
                  <span className="cursor-default">Privacy Policy</span>
                </li>
                <li>
                  <span className="cursor-default">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-border pt-8 sm:flex-row">
          <p className="text-xs text-brand-muted">
            &copy; {new Date().getFullYear()} LuxLoft716 Salon Suites.
          </p>
          <p className="text-xs text-brand-muted">Buffalo, NY &middot; Area code 716</p>
        </div>
      </div>
    </footer>
  )
}

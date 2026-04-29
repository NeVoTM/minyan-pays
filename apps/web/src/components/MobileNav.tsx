import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function MobileNav() {
  const { t } = useTranslation()
  const items: { to: string; labelKey: string; end?: boolean }[] = [
    { to: '/punch', labelKey: 'nav.punch', end: true },
    { to: '/member', labelKey: 'nav.member', end: true },
    { to: '/rabbi', labelKey: 'nav.rabbi', end: true },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 rounded-t-[1.75rem] border border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1 pt-1">
        {items.map(({ to, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              (() => {
                const base =
                  'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-tight transition sm:text-[11px]'
                if (to === '/punch') {
                  return `${base} ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-rose-50 text-slate-900'
                      : 'bg-gradient-to-r from-emerald-50/60 to-rose-50/60 text-slate-700 active:from-emerald-100 active:to-rose-100'
                  }`
                }
                return `${base} ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 active:bg-slate-50 active:text-slate-700'
                }`
              })()
            }
          >
            {t(labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

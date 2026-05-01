import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function MobileNav() {
  const { t } = useTranslation()
  const items: {
    to: string
    labelKey: string
    end?: boolean
    activeClass: string
    idleClass: string
  }[] = [
    {
      to: '/punch',
      labelKey: 'nav.punch',
      end: true,
      activeClass:
        'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30',
      idleClass:
        'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/80',
    },
    {
      to: '/member',
      labelKey: 'nav.member',
      end: true,
      activeClass:
        'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-700',
      idleClass:
        'bg-violet-50 text-violet-900 border border-violet-200',
    },
    {
      to: '/rabbi',
      labelKey: 'nav.rabbi',
      end: true,
      activeClass:
        'bg-amber-500 text-white shadow-md shadow-amber-500/35 border border-amber-600',
      idleClass:
        'bg-amber-50 text-amber-950 border border-amber-200',
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 rounded-t-[1.75rem] border border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 pt-1">
        {items.map(({ to, labelKey, end, activeClass, idleClass }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const base =
                'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-tight transition sm:text-[11px]'
              return `${base} ${isActive ? activeClass : idleClass} active:opacity-90`
            }}
          >
            {t(labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

import { Link } from 'react-router-dom'

type Props = { to?: string; label?: string }

export function BackLink({ to = '/', label = 'Back' }: Props) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-slate-600 shadow-md shadow-slate-200/80 ring-1 ring-slate-100 transition hover:bg-slate-50 active:scale-95"
      aria-label={label}
    >
      ‹
    </Link>
  )
}

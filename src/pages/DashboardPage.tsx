import { Calendar, LogOut, MapPin, Plus, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/useAuth'

const upcoming = [
  {
    id: '1',
    suite: 'LuxLoft716 — Suite A',
    date: 'Jun 5, 2026',
    time: '10:00 AM – 2:00 PM',
    location: 'Elmwood Village, Buffalo',
  },
  {
    id: '2',
    suite: '716 Beauty Collective',
    date: 'Jun 12, 2026',
    time: '9:00 AM – 12:00 PM',
    location: 'Williamsville, NY',
  },
]

export function MemberDashboard() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh bg-brand-black">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/app">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-brand-muted sm:inline">
              {session?.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-red hover:text-brand-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-red">
              Instant Suite
            </p>
            <h1 className="font-serif text-3xl font-bold text-brand-white">
              Welcome back, {session?.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 text-brand-muted">Manage reservations and find your next suite.</p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark"
          >
            <Plus size={16} />
            Book a suite
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-brand-white">
            <Calendar size={20} className="text-brand-red" />
            Upcoming reservations
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcoming.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-brand-border bg-brand-surface p-5"
              >
                <h3 className="font-semibold text-brand-white">{booking.suite}</h3>
                <p className="mt-1 text-sm text-brand-red">{booking.date} · {booking.time}</p>
                <p className="mt-2 flex items-center gap-1 text-sm text-brand-muted">
                  <MapPin size={14} />
                  {booking.location}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export function TeamDashboard() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login/team')
  }

  return (
    <div className="min-h-dvh bg-brand-black">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/team/app">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-brand-muted sm:inline">
              {session?.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-red hover:text-brand-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-red">
            Suite Teams
          </p>
          <h1 className="font-serif text-3xl font-bold text-brand-white">Team dashboard</h1>
          <p className="mt-2 text-brand-muted">
            Manage member access, budgets, and utilization across your organization.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Active members', value: '24', icon: Users },
            { label: 'Bookings this month', value: '87', icon: Calendar },
            { label: 'Locations used', value: '6', icon: MapPin },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-brand-border bg-brand-surface p-6"
            >
              <stat.icon size={22} className="text-brand-red" />
              <p className="mt-4 font-serif text-3xl font-bold text-brand-white">{stat.value}</p>
              <p className="mt-1 text-sm text-brand-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { demoHint, type UserRole } from '../lib/auth'

type LoginPageProps = {
  role: UserRole
  title: string
  subtitle: string
  alternate: { label: string; href: string }
}

export function LoginPage({ role, title, subtitle, alternate }: LoginPageProps) {
  const { login, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hint = demoHint(role)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from =
    (location.state as { from?: string } | null)?.from ??
    (role === 'team' ? '/team/app' : '/app')

  if (session) {
    const dest = session.role === 'team' ? '/team/app' : '/app'
    return <Navigate to={dest} replace />
  }

  function fillDemo() {
    setEmail(hint.email)
    setPassword(hint.password)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    window.setTimeout(() => {
      const ok = login(email, password, role)
      setLoading(false)
      if (ok) {
        navigate(from, { replace: true })
      } else {
        setError('Invalid email or password. Try the demo credentials below.')
      }
    }, 400)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(227,0,0,0.1),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <Link to="/" className="mb-10 inline-block self-center">
          <Logo size="md" />
        </Link>

        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-white">{title}</h1>
          <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-black px-4 py-3 text-sm text-brand-white outline-none transition focus:border-brand-red"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Password
              </span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-black px-4 py-3 pr-11 text-sm text-brand-white outline-none transition focus:border-brand-red"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-3 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Sign in
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-brand-border bg-brand-black/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Demo access
            </p>
            <p className="mt-2 text-sm text-brand-white">
              <span className="text-brand-muted">Email:</span> {hint.email}
            </p>
            <p className="text-sm text-brand-white">
              <span className="text-brand-muted">Password:</span> {hint.password}
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 text-sm font-medium text-brand-red hover:underline"
            >
              Fill demo credentials
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">
            {alternate.label}{' '}
            <Link to={alternate.href} className="font-medium text-brand-red hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="mt-8 text-center text-sm text-brand-muted transition hover:text-brand-white"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}

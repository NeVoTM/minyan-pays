import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const KEY = 'minyan_member_token'

export function MemberLogin() {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const r = await api<{ token: string }>('/api/auth/member', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      })
      localStorage.setItem(KEY, r.token)
      nav('/member/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold">Member sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-slate-400">
          Phone
          <input
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label className="block text-sm text-slate-400">
          PIN
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-slate-950 hover:bg-amber-500"
        >
          View balance
        </button>
      </form>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  )
}

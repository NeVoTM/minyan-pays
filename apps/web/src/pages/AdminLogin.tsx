import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const KEY = 'minyan_admin_token'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const r = await api<{ token: string }>('/api/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      localStorage.setItem(KEY, r.token)
      nav('/admin/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold">Admin login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-700 py-2 font-medium hover:bg-slate-600"
        >
          Sign in
        </button>
      </form>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  )
}

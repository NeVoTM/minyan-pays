import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

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
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>Admin</h1>
          <p className={pageSubtitle}>Rabbi / treasurer access</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Password</span>
            <input
              type="password"
              className={pillInput}
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button type="submit" className={primaryBtn}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { PhoneInput } from '../components/PhoneInput'
import {
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  primaryBtn,
  cardShell,
} from '../lib/uiClasses'

const KEY = 'minyan_member_token'

export function MemberLogin() {
  const [phoneDigits, setPhoneDigits] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (phoneDigits.length !== 10) {
      setErr('Enter a valid 10-digit phone number.')
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/member', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneDigits, pin }),
      })
      localStorage.setItem(KEY, r.token)
      nav('/member/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>Welcome back</h1>
          <p className={pageSubtitle}>Sign in with your phone and PIN.</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Phone</span>
            <PhoneInput
              className={pillInput}
              value={phoneDigits}
              onChange={setPhoneDigits}
              required
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>PIN</span>
            <input
              type="password"
              className={pillInput}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              minLength={4}
              autoComplete="current-password"
            />
          </label>
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button type="submit" className={primaryBtn}>
            View balance
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/member/signup" className="font-semibold text-blue-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { cardShell, pageSubtitle, pageTitle, primaryBtn } from '../lib/uiClasses'

const KEY = 'minyan_member_token'

type Profile = {
  displayName: string
  phone: string
  zellePhone: string | null
  wifeZellePhone: string | null
  paypalAccount: string | null
  email: string | null
  bonusRecipient: string
  isMarried: boolean
}

function displayPhone(s: string | null): string {
  if (!s?.trim()) return '—'
  const d = s.replace(/\D/g, '')
  if (d.length === 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }
  return s.trim()
}

export function MemberBilling() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [p, setP] = useState<Profile | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      nav('/member/login')
      return
    }
    try {
      const r = await api<Profile>('/api/me/profile', { token })
      setP(r)
      setErr(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Load failed')
    }
  }, [token, nav])

  useEffect(() => {
    void load()
  }, [load])

  if (!token) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BackLink to="/member/app" />
        <div className="min-w-0 flex-1">
          <h1 className={pageTitle}>Billing</h1>
          <p className={pageSubtitle}>Setup payment methods for payouts</p>
        </div>
      </div>

      {err && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {err}
        </p>
      )}

      <div className={cardShell}>
        <h2 className="text-base font-bold text-slate-900">Payment methods</h2>
        <p className="mt-1 text-xs text-slate-500">
          Numbers and accounts used for Zelle and PayPal. More options will appear
          here as we add them.
        </p>
        <ul className="mt-5 space-y-0 divide-y divide-slate-100 rounded-2xl bg-slate-50/80 p-1 ring-1 ring-slate-100">
          <li className="flex items-start gap-3 rounded-2xl px-3 py-3.5">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6D1ED4] text-xs font-bold text-white"
              aria-hidden
            >
              Z
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Zelle (you)</p>
              <p className="font-semibold text-slate-900">
                {displayPhone(p?.zellePhone ?? null)}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-3 py-3.5">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xs font-bold text-white"
              aria-hidden
            >
              Z
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">
                Zelle (spouse / alternate)
              </p>
              <p className="font-semibold text-slate-900">
                {p?.isMarried
                  ? displayPhone(p?.wifeZellePhone ?? null)
                  : '—'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-3 py-3.5">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0070BA] text-[10px] font-bold text-white"
              aria-hidden
            >
              P
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">PayPal</p>
              <p className="break-all font-semibold text-slate-900">
                {p?.paypalAccount?.trim() || '—'}
              </p>
            </div>
          </li>
        </ul>
        <p className="mt-4 text-center text-xs text-blue-600">
          + Add more (coming soon)
        </p>
      </div>

      <div className={cardShell}>
        <h2 className="text-sm font-bold text-slate-900">Payout preference</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bonus recipient:{' '}
          <strong className="text-slate-900">
            {p?.bonusRecipient === 'WIFE' ? 'Spouse Zelle' : 'Your Zelle'}
          </strong>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Contact the rabbi or admin to change payment details on file.
        </p>
      </div>

      <Link
        to="/member/app"
        className={`${primaryBtn} flex items-center justify-center no-underline`}
      >
        Back to balance
      </Link>
    </div>
  )
}

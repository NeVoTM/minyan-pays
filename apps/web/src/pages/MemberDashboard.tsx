import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import {
  cardShell,
  pageSubtitle,
  pageTitle,
  primaryBtn,
} from '../lib/uiClasses'

const KEY = 'minyan_member_token'

type Balance = {
  settings: { synagogueName: string; firstNineCents: number; weeklyBonusCents: number }
  attendanceLog: {
    dateKey: string
    punchInAt: string
    punchOutAt: string | null
    punchInConfirmedAt: string | null
  }[]
  earningsByWeek: Record<
    string,
    {
      dailyLines: { dateKey: string; amountCents: number; firstNine: boolean }[]
      weeklyBonusCents: number
      totalCents: number
    }
  >
}

export function MemberDashboard() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [data, setData] = useState<Balance | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [punchOutLoading, setPunchOutLoading] = useState(false)
  const [punchMsg, setPunchMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      nav('/member')
      return
    }
    try {
      const b = await api<Balance>('/api/me/balance', { token })
      setData(b)
      setErr(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Load failed')
    }
  }, [token, nav])

  useEffect(() => {
    void load()
  }, [load])

  async function punchOut() {
    if (!token) return
    setPunchOutLoading(true)
    setPunchMsg(null)
    try {
      const r = await api<{ punchOutAt: string }>('/api/punch/out', {
        method: 'POST',
        token,
        body: '{}',
      })
      setPunchMsg(`Punched out at ${new Date(r.punchOutAt).toLocaleString()}`)
      await load()
    } catch (e: unknown) {
      setPunchMsg(e instanceof Error ? e.message : 'Error')
    } finally {
      setPunchOutLoading(false)
    }
  }

  if (!token) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <BackLink to="/" />
          <div>
            <h1 className={pageTitle}>Your balance</h1>
            <p className={pageSubtitle}>
              {data?.settings.synagogueName ?? '…'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
          onClick={() => {
            localStorage.removeItem(KEY)
            nav('/member')
          }}
        >
          Log out
        </button>
      </div>

      {err && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {err}
        </p>
      )}

      <Link
        to="/member/billing"
        className={`${cardShell} flex items-center justify-between gap-3 no-underline transition hover:ring-2 hover:ring-blue-200`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Billing
          </p>
          <p className="font-semibold text-slate-900">Payment methods</p>
          <p className="text-xs text-slate-500">Zelle, PayPal &amp; more</p>
        </div>
        <span className="text-slate-300" aria-hidden>
          ›
        </span>
      </Link>

      <div className={cardShell}>
        <button
          type="button"
          disabled={punchOutLoading}
          className={primaryBtn}
          onClick={() => void punchOut()}
        >
          {punchOutLoading ? 'Saving…' : 'Punch out (after minyan)'}
        </button>
        {punchMsg && (
          <p className="mt-3 text-sm text-slate-600">{punchMsg}</p>
        )}
      </div>

      {data && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Earnings by week</h2>
          {Object.entries(data.earningsByWeek).map(([week, e]) => (
            <div
              key={week}
              className="rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
            >
              <p className="font-semibold text-slate-900">Week starting {week}</p>
              <p className="mt-1 text-sm text-slate-600">
                Total (estimated):{' '}
                <strong className="text-slate-900">
                  ${(e.totalCents / 100).toFixed(2)}
                </strong>
                {e.weeklyBonusCents > 0 && (
                  <span className="text-emerald-600">
                    {' '}
                    (incl. ${(e.weeklyBonusCents / 100).toFixed(2)} weekly bonus)
                  </span>
                )}
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
                {e.dailyLines.map((d) => (
                  <li key={d.dateKey}>
                    {d.dateKey}:{' '}
                    {d.amountCents > 0
                      ? `$${(d.amountCents / 100).toFixed(2)} (first nine)`
                      : d.firstNine
                        ? '—'
                        : 'no payout / not first nine'}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data && data.attendanceLog.length > 0 && (
        <div className={cardShell}>
          <h2 className="text-sm font-bold text-slate-900">
            Confirmed punch-ins
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {data.attendanceLog.map((row) => (
              <li key={row.dateKey + row.punchInAt}>
                <span className="font-medium text-slate-800">{row.dateKey}</span> — in{' '}
                {new Date(row.punchInAt).toLocaleString()}
                {row.punchInConfirmedAt && (
                  <> · confirmed {new Date(row.punchInConfirmedAt).toLocaleString()}</>
                )}
                {row.punchOutAt
                  ? <> · out {new Date(row.punchOutAt).toLocaleString()}</>
                  : ' · no punch-out'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

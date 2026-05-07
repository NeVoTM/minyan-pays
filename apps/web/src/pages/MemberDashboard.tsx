import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { cardShell, pageTitle, primaryBtn } from '../lib/uiClasses'

const KEY = 'minyan_member_token'

type Balance = {
  totals: {
    earnedCents: number
    paidCents: number
    donatedCents: number
    owedCents: number
    eligibleCashoutCents: number
  }
  donations: { amountCents: number; charityName: string | null; createdAt: string }[]
  detail: {
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
}

export function MemberDashboard() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [data, setData] = useState<Balance | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [punchOutLoading, setPunchOutLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [punchMsg, setPunchMsg] = useState<string | null>(null)
  const [actionAmount, setActionAmount] = useState('')
  const [charities, setCharities] = useState<{ id: string; name: string }[]>([])
  const [charityId, setCharityId] = useState('')

  const load = useCallback(async () => {
    if (!token) {
      nav('/member/login')
      return
    }
    try {
      const b = await api<Balance>('/api/me/balance', { token })
      const c = await api<{ items: { id: string; name: string }[] }>('/api/me/charities', { token })
      setData(b)
      setCharities(c.items)
      if (!charityId && c.items[0]) setCharityId(c.items[0].id)
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

  async function cancelTodayCheckIn() {
    if (!token) return
    const reason = window.prompt(
      'Reason for canceling this check-in (optional):',
      'Need to leave / changed plans'
    )
    if (reason === null) return
    setCancelLoading(true)
    setPunchMsg(null)
    try {
      await api('/api/me/checkin/cancel-today', {
        method: 'POST',
        token,
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      setPunchMsg(
        'Your check-in was canceled and removed from payout calculation. Rabbi has been notified in the canceled list.'
      )
      await load()
    } catch (e: unknown) {
      setPunchMsg(e instanceof Error ? e.message : 'Error')
    } finally {
      setCancelLoading(false)
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
          </div>
        </div>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
          onClick={() => {
            localStorage.removeItem(KEY)
            nav('/member/login')
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
        to="/member/profile"
        className={`${cardShell} flex items-center justify-between gap-3 no-underline transition hover:ring-2 hover:ring-blue-200`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Member profile
          </p>
          <p className="font-semibold text-slate-900">View / edit details</p>
          <p className="text-xs text-slate-500">PIN, address, and Zelle numbers</p>
        </div>
        <span className="text-slate-300" aria-hidden>
          ›
        </span>
      </Link>

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
        {data && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <div>Earned: <strong>${(data.totals.earnedCents / 100).toFixed(2)}</strong></div>
            <div>Paid: <strong>${(data.totals.paidCents / 100).toFixed(2)}</strong></div>
            <div>Donated: <strong>${(data.totals.donatedCents / 100).toFixed(2)}</strong></div>
            <div>Amount owed: <strong>${(data.totals.owedCents / 100).toFixed(2)}</strong></div>
            <div>Cash-out eligible (7+ days): <strong>${(data.totals.eligibleCashoutCents / 100).toFixed(2)}</strong></div>
          </div>
        )}
        <button
          type="button"
          disabled={punchOutLoading}
          className={primaryBtn}
          onClick={() => void punchOut()}
        >
          {punchOutLoading ? 'Saving…' : 'Punch out (after minyan)'}
        </button>
        <button
          type="button"
          disabled={cancelLoading}
          className="mt-2 w-full rounded-full border border-rose-300 bg-rose-50 py-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
          onClick={() => void cancelTodayCheckIn()}
        >
          {cancelLoading ? 'Canceling…' : 'Cancel today check-in'}
        </button>
        {punchMsg && (
          <p className="mt-3 text-sm text-slate-600">{punchMsg}</p>
        )}

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Cash out or donate</h3>
          <input
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm"
            placeholder="Amount in dollars (e.g. 25.00)"
            value={actionAmount}
            onChange={(e) => setActionAmount(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={async () => {
                if (!token) return
                const amountCents = Math.round(Number(actionAmount || '0') * 100)
                try {
                  await api('/api/me/balance/cashout-request', {
                    method: 'POST',
                    token,
                    body: JSON.stringify({ amountCents }),
                  })
                  setPunchMsg('Cash-out request submitted.')
                  await load()
                } catch (e: unknown) {
                  setPunchMsg(e instanceof Error ? e.message : 'Request failed')
                }
              }}
            >
              Request cash out
            </button>
            <div className="flex gap-2">
              <select
                className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm"
                value={charityId}
                onChange={(e) => setCharityId(e.target.value)}
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  if (!token || !charityId) return
                  const amountCents = Math.round(Number(actionAmount || '0') * 100)
                  try {
                    await api('/api/me/balance/donate', {
                      method: 'POST',
                      token,
                      body: JSON.stringify({ amountCents, charityId }),
                    })
                    setPunchMsg('Donation recorded.')
                    await load()
                  } catch (e: unknown) {
                    setPunchMsg(e instanceof Error ? e.message : 'Donation failed')
                  }
                }}
              >
                Donate
              </button>
            </div>
          </div>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Earnings by week</h2>
          {Object.entries(data.detail.earningsByWeek).map(([week, e]) => (
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

      {data && data.detail.attendanceLog.length > 0 && (
        <div className={cardShell}>
          <h2 className="text-sm font-bold text-slate-900">
            Confirmed punch-ins
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {data.detail.attendanceLog.map((row) => (
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

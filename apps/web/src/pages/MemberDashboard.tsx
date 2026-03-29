import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

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
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
          ← Home
        </Link>
        <button
          type="button"
          className="text-sm text-slate-500"
          onClick={() => {
            localStorage.removeItem(KEY)
            nav('/member')
          }}
        >
          Log out
        </button>
      </div>
      <h1 className="text-xl font-semibold">Your attendance</h1>
      {data && (
        <p className="text-sm text-slate-400">{data.settings.synagogueName}</p>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <button
        type="button"
        disabled={punchOutLoading}
        className="w-full rounded-lg border border-amber-500/40 bg-amber-950/30 py-3 font-medium text-amber-100 hover:bg-amber-950/50 disabled:opacity-50"
        onClick={() => void punchOut()}
      >
        {punchOutLoading ? 'Saving…' : 'Punch out (after minyan)'}
      </button>
      {punchMsg && (
        <p className="text-sm text-slate-400">{punchMsg}</p>
      )}

      {data && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-300">Earnings by week</h2>
          {Object.entries(data.earningsByWeek).map(([week, e]) => (
            <div
              key={week}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm"
            >
              <p className="font-medium text-amber-100/90">
                Week starting {week}
              </p>
              <p className="text-slate-300">
                Total (estimated):{' '}
                <strong>${(e.totalCents / 100).toFixed(2)}</strong>
                {e.weeklyBonusCents > 0 && (
                  <span className="text-emerald-400">
                    {' '}
                    (includes ${(e.weeklyBonusCents / 100).toFixed(2)} weekly
                    bonus)
                  </span>
                )}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
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
        <div>
          <h2 className="text-sm font-medium text-slate-300">
            Confirmed punch-ins (timestamps)
          </h2>
          <ul className="mt-2 space-y-2 text-xs text-slate-500">
            {data.attendanceLog.map((row) => (
              <li key={row.dateKey + row.punchInAt}>
                <span className="text-slate-400">{row.dateKey}</span> — in{' '}
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

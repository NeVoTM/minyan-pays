import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, fetchBlob } from '../api'
import { RABBI_KEY } from './RabbiLogin'

type PendingMember = {
  id: string
  displayName: string
  phone: string
  attendanceCode: string
  addressLine1: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  email: string | null
  createdAt: string
}

type SessionResp = {
  dateKey: string
  sessionId: string
  attendances: {
    id: string
    punchInAt: string
    punchInStatus: string
    punchOutAt: string | null
    wouldBeFirstNine: boolean
    user: {
      id: string
      displayName: string
      phone: string
      attendanceCode: string
    }
  }[]
}

type WeekRow = {
  userId: string
  displayName: string
  phone: string
  breakdown: {
    totalCents: number
    dailyLines: { dateKey: string; amountCents: number; firstNine: boolean }[]
  }
  paidAt: string | null
}

type WeekReport = {
  weekSundayKey: string
  dateKeysInWeek: string[]
  rows: WeekRow[]
}

export function RabbiDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const token = localStorage.getItem(RABBI_KEY)
  const [tab, setTab] = useState<'approvals' | 'today' | 'payouts' | 'banner'>(
    'approvals'
  )
  const [pending, setPending] = useState<PendingMember[]>([])
  const [session, setSession] = useState<SessionResp | null>(null)
  const [weekDate, setWeekDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [weekExportDate, setWeekExportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [weekReport, setWeekReport] = useState<WeekReport | null>(null)
  const [paidDraft, setPaidDraft] = useState<Record<string, boolean>>({})
  const [filterDate, setFilterDate] = useState<string>('')
  const [bannerDraft, setBannerDraft] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      nav('/rabbi')
      return
    }
    try {
      const [p, s, st] = await Promise.all([
        api<PendingMember[]>('/api/rabbi/members/pending', { token }),
        api<SessionResp>('/api/rabbi/session/today', { token }),
        api<{ rabbiBanner: string }>('/api/rabbi/settings', { token }),
      ])
      setPending(p)
      setSession(s)
      setBannerDraft(st.rabbiBanner ?? '')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }, [token, nav, t])

  useEffect(() => {
    void load()
  }, [load])

  const loadWeek = useCallback(async () => {
    if (!token) return
    setErr(null)
    setMsg(null)
    try {
      const r = await api<WeekReport>(
        `/api/rabbi/reports/week/${weekDate}`,
        { token }
      )
      setWeekReport(r)
      const next: Record<string, boolean> = {}
      for (const row of r.rows) {
        next[row.userId] = !!row.paidAt
      }
      setPaidDraft(next)
    } catch (e: unknown) {
      setWeekReport(null)
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }, [token, weekDate, t])

  useEffect(() => {
    if (tab === 'payouts' && token) void loadWeek()
  }, [tab, token, loadWeek])

  async function approvePending(id: string) {
    if (!token) return
    setMsg(null)
    try {
      await api(`/api/rabbi/members/${id}/approve`, { method: 'POST', token })
      setMsg(t('rabbi.approved'))
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }

  async function confirm(id: string) {
    if (!token) return
    await api(`/api/rabbi/attendance/${id}/confirm`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  async function reject(id: string) {
    if (!token) return
    await api(`/api/rabbi/attendance/${id}/reject`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  async function savePayouts() {
    if (!token || !weekReport) return
    setErr(null)
    setMsg(null)
    try {
      await api(`/api/rabbi/reports/week/${weekDate}/payouts`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ marks: paidDraft }),
      })
      setMsg(t('rabbi.saved'))
      await loadWeek()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }

  async function saveBanner() {
    if (!token) return
    setErr(null)
    setMsg(null)
    try {
      await api('/api/rabbi/settings/banner', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ rabbiBanner: bannerDraft.trim() || null }),
      })
      setMsg(t('rabbi.bannerSaved'))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }

  async function downloadWeekPayoutCsv() {
    if (!token) return
    setErr(null)
    setMsg(null)
    try {
      const blob = await fetchBlob(
        `/api/rabbi/export/week/${weekExportDate}.csv`,
        { token }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `minyan-payouts-${weekExportDate}.csv`
      a.rel = 'noopener'
      a.click()
      URL.revokeObjectURL(url)
      setMsg(t('rabbi.downloadStarted'))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.exportFailed'))
    }
  }

  const fmtAttendanceStatus = (s: string) =>
    s === 'PENDING'
      ? t('admin.statusPending')
      : s === 'CONFIRMED'
        ? t('admin.statusConfirmed')
        : t('admin.statusRejected')

  const rowsWithEarnings = useMemo(
    () => weekReport?.rows.filter((r) => r.breakdown.totalCents > 0) ?? [],
    [weekReport]
  )

  function selectAllWithEarnings() {
    const next = { ...paidDraft }
    for (const r of rowsWithEarnings) {
      next[r.userId] = true
    }
    setPaidDraft(next)
  }

  function selectByDate() {
    if (!weekReport || !filterDate) return
    const next = { ...paidDraft }
    for (const r of weekReport.rows) {
      const hit = r.breakdown.dailyLines.some(
        (l) => l.dateKey === filterDate && l.amountCents > 0
      )
      if (hit) next[r.userId] = true
    }
    setPaidDraft(next)
  }

  function clearPaidMarks() {
    if (!weekReport) return
    const next: Record<string, boolean> = {}
    for (const r of weekReport.rows) {
      next[r.userId] = false
    }
    setPaidDraft(next)
  }

  function togglePaid(userId: string, v: boolean) {
    setPaidDraft((d) => ({ ...d, [userId]: v }))
  }

  if (!token) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/"
          className="text-[11px] text-slate-500 hover:text-slate-700 sm:text-xs"
        >
          {t('admin.home')}
        </Link>
        <button
          type="button"
          className="text-[11px] text-slate-500 sm:text-xs"
          onClick={() => {
            localStorage.removeItem(RABBI_KEY)
            nav('/rabbi')
          }}
        >
          {t('rabbi.logout')}
        </button>
      </div>
      <h1 className="text-lg font-semibold leading-tight sm:text-xl">
        {t('rabbi.title')}
      </h1>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Rabbi">
        {(['approvals', 'today', 'payouts', 'banner'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium uppercase sm:text-xs ${
              tab === id
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            onClick={() => setTab(id)}
          >
            {t(`rabbi.${id}`)}
          </button>
        ))}
      </nav>

      {tab === 'approvals' && (
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <ul className="grid gap-2 sm:grid-cols-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-[11px] sm:text-xs"
              >
                <p className="font-medium text-slate-900">{m.displayName}</p>
                <p className="font-mono text-[10px] text-slate-500">{m.phone}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  {m.attendanceCode}
                </p>
                <button
                  type="button"
                  className="mt-1 text-emerald-700 underline"
                  onClick={() => void approvePending(m.id)}
                >
                  {t('rabbi.approve')}
                </button>
              </li>
            ))}
          </ul>
          {pending.length === 0 && (
            <p className="text-xs text-slate-500">{t('rabbi.noPending')}</p>
          )}
        </div>
      )}

      {tab === 'today' && session && (
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <ul className="grid gap-2 sm:grid-cols-2">
            {session.attendances.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] sm:text-xs"
              >
                <p className="font-medium text-slate-900">{a.user.displayName}</p>
                <p className="text-slate-500">
                  {fmtAttendanceStatus(a.punchInStatus)}
                </p>
                {a.punchInStatus === 'PENDING' && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="rounded bg-emerald-800 px-2 py-1 text-white"
                      onClick={() => void confirm(a.id)}
                    >
                      {t('rabbi.confirm')}
                    </button>
                    <button
                      type="button"
                      className="rounded bg-slate-700 px-2 py-1 text-white"
                      onClick={() => void reject(a.id)}
                    >
                      {t('rabbi.reject')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {session.attendances.length === 0 && (
            <p className="text-xs text-slate-500">{t('admin.noPunchInsToday')}</p>
          )}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <h2 className="mb-1.5 text-xs font-medium text-slate-700 sm:text-sm">
              {t('rabbi.weeklyExport')}
            </h2>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-600">
                {t('rabbi.weekAnyDay')}
                <input
                  type="date"
                  className="mx-1 rounded border border-slate-200 px-2 py-1"
                  value={weekExportDate}
                  onChange={(e) => setWeekExportDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
                onClick={() => void downloadWeekPayoutCsv()}
              >
                {t('rabbi.downloadCsv')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-600">
              {t('rabbi.weekLabel')}
              <input
                type="date"
                className="mx-1 rounded border border-slate-200 px-2 py-1"
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
              onClick={() => void loadWeek()}
            >
              {t('rabbi.loadWeek')}
            </button>
          </div>

          {weekReport && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  onClick={selectAllWithEarnings}
                >
                  {t('rabbi.selectAll')}
                </button>
                <select
                  className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="">{t('rabbi.allDates')}</option>
                  {weekReport.dateKeysInWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  onClick={selectByDate}
                  disabled={!filterDate}
                >
                  {t('rabbi.selectByDate')}
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  onClick={clearPaidMarks}
                >
                  {t('rabbi.clearSelection')}
                </button>
              </div>

              <div className="max-h-[50vh] overflow-auto">
                <table className="w-full min-w-[280px] text-left text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-1 pr-2">{t('rabbi.paid')}</th>
                      <th className="py-1 pr-2">{t('rabbi.payoutName')}</th>
                      <th className="py-1 pr-2">{t('rabbi.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekReport.rows.map((r) => (
                      <tr key={r.userId} className="border-b border-slate-100">
                        <td className="py-1 pr-2">
                          <input
                            type="checkbox"
                            checked={!!paidDraft[r.userId]}
                            onChange={(e) =>
                              togglePaid(r.userId, e.target.checked)
                            }
                          />
                        </td>
                        <td className="py-1 pr-2">{r.displayName}</td>
                        <td className="py-1 pr-2">{r.breakdown.totalCents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white"
                onClick={() => void savePayouts()}
              >
                {t('rabbi.savePayouts')}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'banner' && (
        <div className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-xs sm:text-sm">
          <h2 className="mb-2 font-medium text-blue-900/95 sm:text-sm">
            {t('rabbi.bannerTitle')}
          </h2>
          <textarea
            className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-slate-700"
            rows={4}
            maxLength={2000}
            placeholder={t('rabbi.bannerPlaceholder')}
            value={bannerDraft}
            onChange={(e) => setBannerDraft(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => void saveBanner()}
          >
            {t('rabbi.saveBanner')}
          </button>
        </div>
      )}
    </div>
  )
}

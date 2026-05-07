import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, fetchBlob } from '../api'
import { PhoneInput } from '../components/PhoneInput'
import { RABBI_KEY } from './RabbiLogin'
import { formatPhoneDigits, phoneDigitsFromE164 } from '../lib/phoneDisplay'

type RabbiMemberRow = {
  id: string
  displayName: string
  phone: string
  attendanceCode: string
  preferredForCheckIn: boolean
}

type SessionUser = {
  id: string
  displayName: string
  phone: string
  attendanceCode: string
  addressLine1: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  email: string | null
}

type SessionResp = {
  dateKey: string
  timezone: string
  sessionId: string
  attendances: {
    id: string
    punchInAt: string
    punchInStatus: string
    punchOutAt: string | null
    wouldBeFirstNine: boolean
    user: SessionUser
  }[]
  canceledAttendances: {
    id: string
    punchInAt: string
    canceledAt: string | null
    canceledByRole: string | null
    canceledReason: string | null
    user: { id: string; displayName: string; phone: string }
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
  canceledAttendances: {
    id: string
    userId: string
    displayName: string
    phone: string
    dateKey: string
    punchInAt: string
    canceledAt: string | null
    canceledByRole: string | null
    canceledReason: string | null
  }[]
}

type RabbiMemberDetail = {
  id: string
  firstName: string
  lastName: string
  displayName: string
  phone: string
  attendanceCode: string
  isMarried: boolean
  zellePhone: string | null
  wifeZellePhone: string | null
  bonusRecipient: 'SELF' | 'WIFE'
  addressLine1: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  email: string | null
  spousePhone: string | null
  spouseEmail: string | null
  paypalAccount: string | null
  achRoutingNumber: string | null
  achAccountNumber: string | null
}

function formatMemberAddress(u: SessionUser): string {
  const parts = [
    u.addressLine1,
    [u.city, u.stateRegion].filter(Boolean).join(', ') || null,
    u.postalCode,
  ].filter(Boolean) as string[]
  return parts.length ? parts.join(' · ') : '—'
}

function formatPunchInAt(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString()
  }
}

function isPunchCodeTaken(
  members: RabbiMemberRow[],
  code: string,
  excludeId?: string
): boolean {
  const c = code.trim().toLowerCase()
  return members.some(
    (m) =>
      m.id !== excludeId && m.attendanceCode.trim().toLowerCase() === c
  )
}

const TAB_STYLES: Record<
  'today' | 'members' | 'payouts' | 'banner',
  { active: string; idle: string }
> = {
  today: {
    active:
      'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
    idle:
      'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
  },
  members: {
    active:
      'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/25',
    idle:
      'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100',
  },
  payouts: {
    active:
      'border-amber-600 bg-amber-500 text-white shadow-md shadow-amber-500/30',
    idle:
      'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
  },
  banner: {
    active:
      'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/25',
    idle: 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100',
  },
}

export function RabbiDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const token = localStorage.getItem(RABBI_KEY)
  const [tab, setTab] = useState<'today' | 'members' | 'payouts' | 'banner'>(
    'today'
  )
  const [rabbiMembers, setRabbiMembers] = useState<RabbiMemberRow[]>([])
  const [checkInOnlyPreferred, setCheckInOnlyPreferred] = useState(false)
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

  const [rabbiEditUserId, setRabbiEditUserId] = useState<string | null>(null)
  const [editDetail, setEditDetail] = useState<RabbiMemberDetail | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editErr, setEditErr] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneDigits: '',
    attendanceCode: '',
    addressLine1: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    email: '',
    zelleDigits: '',
    wifeZelleDigits: '',
    bonusRecipient: 'WIFE' as 'SELF' | 'WIFE',
    pin: '',
  })

  const load = useCallback(async () => {
    if (!token) {
      nav('/rabbi')
      return
    }
    try {
      const [mem, s, st] = await Promise.all([
        api<RabbiMemberRow[]>('/api/rabbi/members', { token }),
        api<SessionResp>('/api/rabbi/session/today', { token }),
        api<{ rabbiBanner: string; checkInOnlyPreferred: boolean }>(
          '/api/rabbi/settings',
          { token }
        ),
      ])
      setRabbiMembers(mem)
      setSession(s)
      setBannerDraft(st.rabbiBanner ?? '')
      setCheckInOnlyPreferred(st.checkInOnlyPreferred)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }, [token, nav, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!token || !rabbiEditUserId) {
      setEditDetail(null)
      return
    }
    let cancelled = false
    setEditLoading(true)
    setEditErr(null)
    void api<RabbiMemberDetail>(`/api/rabbi/members/${rabbiEditUserId}`, {
      token,
    })
      .then((d) => {
        if (cancelled) return
        setEditDetail(d)
        setEditForm({
          firstName: d.firstName,
          lastName: d.lastName,
          phoneDigits: phoneDigitsFromE164(d.phone),
          attendanceCode: d.attendanceCode,
          addressLine1: d.addressLine1 ?? '',
          city: d.city ?? '',
          stateRegion: d.stateRegion ?? '',
          postalCode: d.postalCode ?? '',
          email: d.email ?? '',
          zelleDigits: d.zellePhone ? phoneDigitsFromE164(d.zellePhone) : '',
          wifeZelleDigits: d.wifeZellePhone
            ? phoneDigitsFromE164(d.wifeZellePhone)
            : '',
          bonusRecipient: d.bonusRecipient,
          pin: '',
        })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setEditErr(
            e instanceof Error ? e.message : t('rabbi.loadFailed')
          )
        }
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, rabbiEditUserId, t])

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

  async function saveCheckInPolicy(onlyPreferred: boolean) {
    if (!token) return
    setErr(null)
    setMsg(null)
    try {
      await api('/api/rabbi/settings/check-in-policy', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ checkInOnlyPreferred: onlyPreferred }),
      })
      setCheckInOnlyPreferred(onlyPreferred)
      setMsg(t('rabbi.policySaved'))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbi.loadFailed'))
    }
  }

  async function setMemberPreferred(id: string, preferred: boolean) {
    if (!token) return
    setErr(null)
    try {
      await api(`/api/rabbi/members/${id}/preferred`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ preferred }),
      })
      setRabbiMembers((rows) =>
        rows.map((r) =>
          r.id === id ? { ...r, preferredForCheckIn: preferred } : r
        )
      )
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

  async function cancelAttendance(id: string) {
    if (!token) return
    const reason = window.prompt(
      'Reason for cancellation (optional):',
      'Member left / changed plans'
    )
    if (reason === null) return
    await api(`/api/rabbi/attendance/${id}/cancel`, {
      method: 'POST',
      token,
      body: JSON.stringify({ reason: reason.trim() || undefined }),
    })
    setMsg('Check-in canceled. It will not count toward payout.')
    await load()
    if (tab === 'payouts') await loadWeek()
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

  async function saveMemberEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editDetail) return
    setEditErr(null)
    if (editForm.phoneDigits.length !== 10) {
      setEditErr(t('admin.phone10'))
      return
    }
    if (
      isPunchCodeTaken(
        rabbiMembers,
        editForm.attendanceCode,
        editDetail.id
      )
    ) {
      setEditErr(t('admin.punchTakenErr'))
      return
    }
    if (editForm.pin.trim().length > 0 && editForm.pin.trim().length < 4) {
      setEditErr(t('admin.pinRule'))
      return
    }
    setEditSaving(true)
    try {
      const body: Record<string, unknown> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phoneDigits,
        attendanceCode: editForm.attendanceCode.trim(),
        isMarried: editDetail.isMarried,
        zellePhone: editForm.zelleDigits.trim() || null,
        wifeZellePhone: editForm.wifeZelleDigits.trim() || null,
        bonusRecipient: editForm.bonusRecipient,
        addressLine1: editForm.addressLine1.trim() || null,
        city: editForm.city.trim() || null,
        stateRegion: editForm.stateRegion.trim() || null,
        postalCode: editForm.postalCode.replace(/\D/g, '').slice(0, 5) || null,
        email: editForm.email.trim() || null,
        spouseEmail: editDetail.spouseEmail,
        paypalAccount: editDetail.paypalAccount,
        achRoutingNumber: editDetail.achRoutingNumber,
        achAccountNumber: editDetail.achAccountNumber,
        spousePhone: editDetail.spousePhone,
      }
      if (editForm.pin.trim().length >= 4) body.pin = editForm.pin.trim()
      await api(`/api/rabbi/members/${editDetail.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      })
      setMsg(t('rabbi.memberUpdated'))
      setRabbiEditUserId(null)
      await load()
    } catch (e: unknown) {
      setEditErr(e instanceof Error ? e.message : t('admin.updateFailed'))
    } finally {
      setEditSaving(false)
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

  const inputCls =
    'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900'

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-3 text-center">
      <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:items-stretch">
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Link
              to="/punch"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 shadow-sm sm:text-xs"
            >
              {t('admin.home')}
            </Link>
            <Link
              to="/admin"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-medium text-indigo-800 shadow-sm sm:text-xs"
            >
              {t('home.staffAdmin')}
            </Link>
          </div>
          <button
            type="button"
            className="w-full shrink-0 rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-800 sm:w-auto sm:text-xs"
            onClick={() => {
              localStorage.removeItem(RABBI_KEY)
              nav('/rabbi')
            }}
          >
            {t('rabbi.logout')}
          </button>
        </div>
      </div>

      <h1 className="text-lg font-semibold leading-tight sm:text-xl">
        {t('rabbi.title')}
      </h1>
      {err && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {err}
        </p>
      )}
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {msg}
        </p>
      )}

      <nav
        className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Rabbi"
      >
        {(['today', 'members', 'payouts', 'banner'] as const).map((id) => {
          const st = TAB_STYLES[id]
          const on = tab === id
          return (
            <button
              key={id}
              type="button"
              className={`rounded-xl border-2 px-2 py-2.5 text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-xs ${
                on ? st.active : st.idle
              }`}
              onClick={() => setTab(id)}
            >
              {t(`rabbi.${id}`)}
            </button>
          )
        })}
      </nav>

      {tab === 'members' && (
        <div className="w-full min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600 sm:text-xs">
            <p className="font-medium text-slate-800">
              {t('rabbi.checkInPolicyTitle')}
            </p>
            <p className="mt-1">{t('rabbi.checkInPolicyHelp')}</p>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="checkin-policy"
                  checked={!checkInOnlyPreferred}
                  onChange={() => void saveCheckInPolicy(false)}
                />
                <span>{t('rabbi.checkInAnyone')}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="checkin-policy"
                  checked={checkInOnlyPreferred}
                  onChange={() => void saveCheckInPolicy(true)}
                />
                <span>{t('rabbi.checkInPreferredOnly')}</span>
              </label>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 sm:text-xs">
            {t('rabbi.preferredMembersHelp')}
          </p>
          <ul className="grid w-full min-w-0 gap-2">
            {rabbiMembers.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[11px] sm:text-xs"
              >
                <p className="font-medium text-slate-900">{m.displayName}</p>
                <p className="font-mono text-[10px] text-slate-500">{m.phone}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  {m.attendanceCode}
                </p>
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.preferredForCheckIn}
                    onChange={(e) =>
                      void setMemberPreferred(m.id, e.target.checked)
                    }
                  />
                  <span>{t('rabbi.preferredForCheckIn')}</span>
                </label>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg border border-indigo-300 bg-indigo-50 py-2 text-[11px] font-semibold text-indigo-900"
                  onClick={() => setRabbiEditUserId(m.id)}
                >
                  {t('rabbi.viewEditMember')}
                </button>
              </li>
            ))}
          </ul>
          {rabbiMembers.length === 0 && (
            <p className="text-xs text-slate-500">
              {t('rabbi.noApprovedMembers')}
            </p>
          )}
        </div>
      )}

      {tab === 'today' && session && (
        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <ul className="grid w-full min-w-0 gap-3">
            {session.attendances.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-[11px] sm:text-xs"
              >
                <p className="font-medium text-slate-900">
                  {a.user.displayName}
                </p>
                <p className="mt-1 text-slate-600">
                  <span className="font-medium text-slate-700">
                    {t('rabbi.memberAddress')}:
                  </span>{' '}
                  {formatMemberAddress(a.user)}
                </p>
                <p className="mt-0.5 text-slate-600">
                  <span className="font-medium text-slate-700">
                    {t('rabbi.checkInTime')}:
                  </span>{' '}
                  {formatPunchInAt(
                    a.punchInAt,
                    session.timezone ?? 'America/New_York'
                  )}
                </p>
                <p className="mt-1 text-slate-500">
                  {fmtAttendanceStatus(a.punchInStatus)}
                </p>
                <div className="mt-3 flex w-full min-w-0 flex-col gap-2">
                  <button
                    type="button"
                    className="w-full rounded-lg border-2 border-indigo-400 bg-indigo-50 py-2.5 text-[11px] font-semibold text-indigo-900"
                    onClick={() => setRabbiEditUserId(a.user.id)}
                  >
                    {t('rabbi.viewEditMember')}
                  </button>
                  {a.punchInStatus === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="w-full rounded-lg bg-emerald-600 py-2.5 text-[11px] font-semibold text-white shadow-sm"
                        onClick={() => void confirm(a.id)}
                      >
                        {t('rabbi.confirm')}
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-lg bg-rose-600 py-2.5 text-[11px] font-semibold text-white shadow-sm"
                        onClick={() => void reject(a.id)}
                      >
                        {t('rabbi.reject')}
                      </button>
                    </>
                  )}
                  {(a.punchInStatus === 'PENDING' ||
                    a.punchInStatus === 'CONFIRMED') && (
                    <button
                      type="button"
                      className="w-full rounded-lg border border-rose-300 bg-rose-50 py-2.5 text-[11px] font-semibold text-rose-900"
                      onClick={() => void cancelAttendance(a.id)}
                    >
                      Cancel check-in
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {session.attendances.length === 0 && (
            <p className="text-xs text-slate-500">
              {t('admin.noPunchInsToday')}
            </p>
          )}
          {session.canceledAttendances.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-3">
              <h3 className="text-xs font-semibold text-slate-700">
                Canceled check-ins
              </h3>
              <ul className="mt-2 space-y-2">
                {session.canceledAttendances.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[11px]"
                  >
                    <p className="font-medium text-slate-900">{a.user.displayName}</p>
                    <p className="text-slate-600">
                      Check-in: {formatPunchInAt(a.punchInAt, session.timezone)}
                    </p>
                    <p className="text-slate-600">
                      Canceled by {a.canceledByRole ?? 'UNKNOWN'}
                      {a.canceledAt
                        ? ` at ${formatPunchInAt(a.canceledAt, session.timezone)}`
                        : ''}
                    </p>
                    {a.canceledReason && (
                      <p className="text-slate-500">Reason: {a.canceledReason}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="w-full min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
              {t('rabbi.weeklyExport')}
            </h2>
            <div className="flex w-full min-w-0 flex-col gap-2">
              <label className="block text-xs text-slate-600">
                {t('rabbi.weekAnyDay')}
                <input
                  type="date"
                  className={`${inputCls} mt-1`}
                  value={weekExportDate}
                  onChange={(e) => setWeekExportDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white"
                onClick={() => void downloadWeekPayoutCsv()}
              >
                {t('rabbi.downloadCsv')}
              </button>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2">
            <label className="block text-xs text-slate-600">
              {t('rabbi.weekLabel')}
              <input
                type="date"
                className={`${inputCls} mt-1`}
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white"
              onClick={() => void loadWeek()}
            >
              {t('rabbi.loadWeek')}
            </button>
          </div>

          {weekReport && (
            <>
              <div className="flex w-full min-w-0 flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-lg border border-teal-300 bg-teal-50 py-2 text-[11px] font-semibold text-teal-900"
                  onClick={selectAllWithEarnings}
                >
                  {t('rabbi.selectAll')}
                </button>
                <select
                  className={inputCls}
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
                  className="w-full rounded-lg border border-amber-300 bg-amber-50 py-2 text-[11px] font-semibold text-amber-900 disabled:opacity-50"
                  onClick={selectByDate}
                  disabled={!filterDate}
                >
                  {t('rabbi.selectByDate')}
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 py-2 text-[11px] font-semibold text-slate-800"
                  onClick={clearPaidMarks}
                >
                  {t('rabbi.clearSelection')}
                </button>
              </div>

              <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-0.5">
                {weekReport.rows.map((r) => (
                  <li
                    key={r.userId}
                    className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/90 p-2 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={!!paidDraft[r.userId]}
                      onChange={(e) =>
                        togglePaid(r.userId, e.target.checked)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {r.displayName}
                      </p>
                      <p className="text-slate-600">
                        {t('rabbi.amount')}: {r.breakdown.totalCents}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg"
                onClick={() => void savePayouts()}
              >
                {t('rabbi.savePayouts')}
              </button>
              {weekReport.canceledAttendances.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <h3 className="text-xs font-semibold text-slate-700">
                    Canceled check-ins (excluded from payout)
                  </h3>
                  <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-0.5 text-[11px]">
                    {weekReport.canceledAttendances.map((c) => (
                      <li key={c.id} className="rounded border border-slate-200 bg-white p-2">
                        <p className="font-medium text-slate-900">{c.displayName}</p>
                        <p className="text-slate-600">
                          {c.dateKey} · {c.phone}
                        </p>
                        <p className="text-slate-500">
                          {c.canceledByRole ?? 'UNKNOWN'}
                          {c.canceledReason ? ` — ${c.canceledReason}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'banner' && (
        <div className="w-full min-w-0 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-left text-xs sm:text-sm">
          <h2 className="mb-2 font-medium text-sky-900 sm:text-sm">
            {t('rabbi.bannerTitle')}
          </h2>
          <textarea
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-700"
            rows={4}
            maxLength={2000}
            placeholder={t('rabbi.bannerPlaceholder')}
            value={bannerDraft}
            onChange={(e) => setBannerDraft(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-semibold text-white"
            onClick={() => void saveBanner()}
          >
            {t('rabbi.saveBanner')}
          </button>
        </div>
      )}

      {rabbiEditUserId && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal
          aria-labelledby="rabbi-edit-title"
        >
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:text-left">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h2
                id="rabbi-edit-title"
                className="text-sm font-semibold text-slate-900"
              >
                {t('rabbi.editMemberTitle')}
              </h2>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600"
                onClick={() => setRabbiEditUserId(null)}
              >
                {t('common.close')}
              </button>
            </div>
            {editLoading && (
              <p className="text-xs text-slate-500">{t('common.loading')}</p>
            )}
            {editErr && (
              <p className="mb-2 text-xs text-red-600">{editErr}</p>
            )}
            {!editLoading && editDetail && (
              <form className="space-y-2 text-left" onSubmit={saveMemberEdit}>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.firstName')}
                  <input
                    className={inputCls}
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.lastName')}
                  <input
                    className={inputCls}
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.mobilePhone')}
                  <PhoneInput
                    className={inputCls}
                    value={editForm.phoneDigits}
                    onChange={(d) =>
                      setEditForm((f) => ({ ...f, phoneDigits: d }))
                    }
                    required
                    autoComplete="off"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('rabbi.punchCodeLabel')}
                  <input
                    className={`${inputCls} font-mono`}
                    value={editForm.attendanceCode}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        attendanceCode: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.line1')}
                  <input
                    className={inputCls}
                    value={editForm.addressLine1}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        addressLine1: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    className={inputCls}
                    placeholder={t('signup.city')}
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                  <input
                    className={inputCls}
                    placeholder={t('signup.state')}
                    value={editForm.stateRegion}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        stateRegion: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={inputCls}
                    placeholder={t('signup.zip')}
                    inputMode="numeric"
                    maxLength={5}
                    value={editForm.postalCode}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        postalCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                      }))
                    }
                  />
                </div>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.emailOpt')}
                  <input
                    type="email"
                    className={inputCls}
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.zelleYou')}
                  <PhoneInput
                    className={inputCls}
                    value={editForm.zelleDigits}
                    onChange={(d) =>
                      setEditForm((f) => ({ ...f, zelleDigits: d }))
                    }
                    autoComplete="off"
                    placeholder={
                      editForm.phoneDigits.length === 10
                        ? formatPhoneDigits(editForm.phoneDigits)
                        : '555-123-4567'
                    }
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('signup.zelleSpouse')}
                  <PhoneInput
                    className={inputCls}
                    value={editForm.wifeZelleDigits}
                    onChange={(d) =>
                      setEditForm((f) => ({ ...f, wifeZelleDigits: d }))
                    }
                    autoComplete="off"
                    placeholder={
                      editForm.phoneDigits.length === 10
                        ? formatPhoneDigits(editForm.phoneDigits)
                        : '555-123-4567'
                    }
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('rabbi.bonusRecipientLabel')}
                  <select
                    className={inputCls}
                    value={editForm.bonusRecipient}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        bonusRecipient: e.target.value as 'SELF' | 'WIFE',
                      }))
                    }
                  >
                    <option value="WIFE">{t('billing.toSpouseZelle')}</option>
                    <option value="SELF">{t('billing.toYourZelle')}</option>
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  {t('rabbi.newPinOptional')}
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    value={editForm.pin}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        pin: e.target.value.replace(/\D/g, '').slice(0, 12),
                      }))
                    }
                    placeholder="••••"
                  />
                </label>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {editSaving ? t('common.loading') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700"
                    onClick={() => setRabbiEditUserId(null)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

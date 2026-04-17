import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, fetchBlob } from '../api'
import { PhoneInput } from '../components/PhoneInput'

const KEY = 'minyan_admin_token'

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
      firstName: string
      lastName: string
      displayName: string
      phone: string
      attendanceCode: string
    }
  }[]
}

type MemberRow = {
  id: string
  firstName: string
  lastName: string
  displayName: string
  phone: string
  attendanceCode: string
  isMarried: boolean
  zellePhone: string | null
  wifeZellePhone: string | null
  bonusRecipient: string
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  email: string | null
  spousePhone: string | null
  spouseEmail: string | null
  paypalAccount: string | null
  achRoutingNumber: string | null
  achAccountNumber: string | null
  isApproved: boolean
  createdAt: string
}

type AttendanceTxn = {
  id: string
  sessionId: string
  sessionDateKey: string
  userId: string
  userDisplayName: string
  userPhone: string
  userPunchInCode: string
  punchInAt: string
  punchInStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  punchInConfirmedAt: string | null
  punchOutAt: string | null
  createdAt: string
}

function emptyMemberForm() {
  return {
    firstName: '',
    lastName: '',
    phoneDigits: '',
    pin: '',
    attendanceCode: '',
    isMarried: false,
    zellePhone: '',
    wifeZellePhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    email: '',
    spousePhoneDigits: '',
    spouseEmail: '',
    paypalAccount: '',
    achRoutingNumber: '',
    achAccountNumber: '',
  }
}

function phoneDigitsFromE164(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^1/, '').slice(0, 10)
}

function maskBankTail(s: string | null): string {
  if (!s?.trim()) return '—'
  const t = s.trim()
  if (t.length <= 4) return '••••'
  return `••••${t.slice(-4)}`
}

/** Punch-in code must be unique per member (used at Punch in kiosk). */
function isPunchInCodeTaken(
  members: MemberRow[],
  code: string,
  excludeId?: string
): boolean {
  const c = code.trim().toLowerCase()
  if (c.length < 4) return false
  return members.some(
    (m) => m.id !== excludeId && m.attendanceCode.toLowerCase() === c
  )
}

const MODAL_BACKDROP =
  'fixed inset-0 z-50 flex items-center justify-center bg-slate-800/30 p-4 backdrop-blur-sm'
const MODAL_TEXT_BTN =
  'font-medium text-slate-700 underline decoration-slate-400 hover:text-slate-900'

export function AdminDashboard() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [session, setSession] = useState<SessionResp | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [treasury, setTreasury] = useState<{
    balanceCents: number
    systemLocked: boolean
  } | null>(null)
  const [settings, setSettings] = useState<{
    synagogueName?: string
    rabbiBanner?: string | null
    firstNineCents: number
    weeklyBonusCents: number
    firstNineSlots: number
  } | null>(null)
  const [attendanceTxns, setAttendanceTxns] = useState<AttendanceTxn[]>([])
  const [editTxn, setEditTxn] = useState<AttendanceTxn | null>(null)
  const [editTxnMsg, setEditTxnMsg] = useState<string | null>(null)
  const [editTxnForm, setEditTxnForm] = useState<{
    punchInAtLocal: string
    punchOutAtLocal: string
    punchInStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  }>({
    punchInAtLocal: '',
    punchOutAtLocal: '',
    punchInStatus: 'PENDING',
  })
  const [rabbiDraft, setRabbiDraft] = useState('')
  const [rabbiBannerMsg, setRabbiBannerMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fund, setFund] = useState('')
  const [newMember, setNewMember] = useState(() => emptyMemberForm())
  const [memberMsg, setMemberMsg] = useState<string | null>(null)
  const [memberConfirm, setMemberConfirm] = useState<string | null>(null)
  const [weekExportDate, setWeekExportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [viewMember, setViewMember] = useState<MemberRow | null>(null)
  const [editMember, setEditMember] = useState<MemberRow | null>(null)
  const [editForm, setEditForm] = useState(() => emptyMemberForm())
  const [editPin, setEditPin] = useState('')
  const [editSaveMsg, setEditSaveMsg] = useState<string | null>(null)
  /** overview | members | today | add | checkio */
  const [adminTab, setAdminTab] = useState<
    'overview' | 'members' | 'today' | 'add' | 'checkio'
  >('overview')
  const prevAdminTab = useRef(adminTab)

  useEffect(() => {
    const prev = prevAdminTab.current
    prevAdminTab.current = adminTab
    if (adminTab !== prev) {
      setMemberMsg(null)
      setMemberConfirm(null)
    }
  }, [adminTab])

  const load = useCallback(async () => {
    if (!token) {
      nav('/admin')
      return
    }
    try {
      const [s, t, st, m, tx] = await Promise.all([
        api<SessionResp>('/api/admin/session/today', { token }),
        api<{ balanceCents: number; systemLocked: boolean }>(
          '/api/admin/treasury',
          { token }
        ),
        api<{
          synagogueName?: string
          rabbiBanner?: string | null
          firstNineCents: number
          weeklyBonusCents: number
          firstNineSlots: number
        }>('/api/admin/settings', { token }),
        api<MemberRow[]>('/api/admin/members', { token }),
        api<AttendanceTxn[]>('/api/admin/attendance', { token }),
      ])
      setSession(s)
      setTreasury(t)
      setSettings(st)
      setRabbiDraft(st.rabbiBanner ?? '')
      setMembers(m)
      setAttendanceTxns(tx)
      setErr(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Load failed')
    }
  }, [token, nav])

  useEffect(() => {
    void load()
  }, [load])

  function openEdit(m: MemberRow) {
    setEditMember(m)
    setEditSaveMsg(null)
    setEditPin('')
    setEditForm({
      firstName: m.firstName,
      lastName: m.lastName,
      phoneDigits: phoneDigitsFromE164(m.phone),
      pin: '',
      attendanceCode: m.attendanceCode,
      isMarried: m.isMarried,
      zellePhone: m.zellePhone ?? '',
      wifeZellePhone: m.wifeZellePhone ?? '',
      addressLine1: m.addressLine1 ?? '',
      addressLine2: m.addressLine2 ?? '',
      city: m.city ?? '',
      stateRegion: m.stateRegion ?? '',
      postalCode: m.postalCode ?? '',
      email: m.email ?? '',
      spousePhoneDigits: m.spousePhone
        ? phoneDigitsFromE164(m.spousePhone)
        : '',
      spouseEmail: m.spouseEmail ?? '',
      paypalAccount: m.paypalAccount ?? '',
      achRoutingNumber: m.achRoutingNumber ?? '',
      achAccountNumber: m.achAccountNumber ?? '',
    })
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editMember) return
    setEditSaveMsg(null)
    if (editForm.phoneDigits.length !== 10) {
      setEditSaveMsg('Phone must be 10 digits.')
      return
    }
    if (
      editForm.spousePhoneDigits.length > 0 &&
      editForm.spousePhoneDigits.length !== 10
    ) {
      setEditSaveMsg('Spouse phone must be 10 digits or empty.')
      return
    }
    if (
      isPunchInCodeTaken(members, editForm.attendanceCode, editMember.id)
    ) {
      setEditSaveMsg(
        'That punch-in code is already in use. Choose a different code.'
      )
      return
    }
    if (editPin.trim().length > 0 && editPin.trim().length < 4) {
      setEditSaveMsg('New PIN must be at least 4 digits, or leave blank to keep.')
      return
    }
    try {
      const body: Record<string, unknown> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phoneDigits,
        attendanceCode: editForm.attendanceCode.trim(),
        isMarried: editForm.isMarried,
        isApproved: editMember.isApproved,
        zellePhone: editForm.zellePhone.trim() || null,
        wifeZellePhone: editForm.wifeZellePhone.trim() || null,
        addressLine1: editForm.addressLine1.trim() || null,
        addressLine2: editForm.addressLine2.trim() || null,
        city: editForm.city.trim() || null,
        stateRegion: editForm.stateRegion.trim() || null,
        postalCode: editForm.postalCode.trim() || null,
        email: editForm.email.trim() || null,
        spouseEmail: editForm.spouseEmail.trim() || null,
        paypalAccount: editForm.paypalAccount.trim() || null,
        achRoutingNumber: editForm.achRoutingNumber.trim() || null,
        achAccountNumber: editForm.achAccountNumber.trim() || null,
        spousePhone:
          editForm.spousePhoneDigits.length === 10
            ? editForm.spousePhoneDigits
            : null,
      }
      if (editPin.trim().length >= 4) body.pin = editPin.trim()
      await api(`/api/admin/members/${editMember.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      })
      setEditMember(null)
      setEditSaveMsg(null)
      setMemberMsg('Member updated.')
      await load()
    } catch (e: unknown) {
      setEditSaveMsg(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function approveMember(id: string) {
    if (!token) return
    setMemberMsg(null)
    try {
      await api(`/api/admin/members/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isApproved: true }),
      })
      setMemberMsg('Member approved.')
      await load()
    } catch (e: unknown) {
      setMemberMsg(e instanceof Error ? e.message : 'Approve failed')
    }
  }

  async function deleteMember(id: string) {
    if (!token) return
    if (
      !window.confirm(
        'Delete this member permanently? This cannot be undone.'
      )
    ) {
      return
    }
    setEditSaveMsg(null)
    try {
      await api(`/api/admin/members/${id}`, { method: 'DELETE', token })
      setEditMember(null)
      setViewMember((v) => (v?.id === id ? null : v))
      setMemberMsg('Member deleted.')
      await load()
    } catch (e: unknown) {
      setEditSaveMsg(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function confirm(id: string) {
    if (!token) return
    await api(`/api/admin/attendance/${id}/confirm`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  async function reject(id: string) {
    if (!token) return
    await api(`/api/admin/attendance/${id}/reject`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  function memberRowForUserId(userId: string): MemberRow | undefined {
    return members.find((m) => m.id === userId)
  }

  function toLocalInputValue(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openEditTxn(tx: AttendanceTxn) {
    setEditTxn(tx)
    setEditTxnMsg(null)
    setEditTxnForm({
      punchInAtLocal: toLocalInputValue(tx.punchInAt),
      punchOutAtLocal: toLocalInputValue(tx.punchOutAt),
      punchInStatus: tx.punchInStatus,
    })
  }

  async function saveEditTxn(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editTxn) return
    setEditTxnMsg(null)
    if (!editTxnForm.punchInAtLocal) {
      setEditTxnMsg('Punch-in datetime is required.')
      return
    }
    try {
      await api(`/api/admin/attendance/${editTxn.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          punchInAt: new Date(editTxnForm.punchInAtLocal).toISOString(),
          punchOutAt: editTxnForm.punchOutAtLocal
            ? new Date(editTxnForm.punchOutAtLocal).toISOString()
            : null,
          punchInStatus: editTxnForm.punchInStatus,
        }),
      })
      setEditTxn(null)
      setMemberMsg('Check-in/out transaction updated.')
      await load()
    } catch (e: unknown) {
      setEditTxnMsg(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function deleteTxn(id: string) {
    if (!token) return
    if (
      !window.confirm(
        'Delete this check-in/out transaction permanently? This cannot be undone.'
      )
    ) {
      return
    }
    setEditTxnMsg(null)
    try {
      await api(`/api/admin/attendance/${id}`, { method: 'DELETE', token })
      setEditTxn((v) => (v?.id === id ? null : v))
      setMemberMsg('Transaction deleted.')
      await load()
    } catch (e: unknown) {
      setEditTxnMsg(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function addFunds(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !fund) return
    const cents = Math.round(parseFloat(fund) * 100)
    if (Number.isNaN(cents)) return
    await api('/api/admin/treasury/fund', {
      method: 'POST',
      token,
      body: JSON.stringify({ deltaCents: cents }),
    })
    setFund('')
    await load()
  }

  async function createMember(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setMemberMsg(null)
    setMemberConfirm(null)
    if (newMember.phoneDigits.length !== 10) {
      setMemberMsg('Phone must be 10 digits (US).')
      return
    }
    if (
      newMember.spousePhoneDigits.length > 0 &&
      newMember.spousePhoneDigits.length !== 10
    ) {
      setMemberMsg('Spouse phone must be 10 digits or empty.')
      return
    }
    if (isPunchInCodeTaken(members, newMember.attendanceCode)) {
      setMemberMsg(
        'That punch-in code is already in use. Choose a different code.'
      )
      return
    }
    try {
      const r = await api<{
        displayName: string
        attendanceCode: string
        phone: string
      }>('/api/admin/members', {
        method: 'POST',
        token,
        body: JSON.stringify({
          firstName: newMember.firstName.trim(),
          lastName: newMember.lastName.trim(),
          phone: newMember.phoneDigits,
          pin: newMember.pin,
          attendanceCode: newMember.attendanceCode.trim(),
          isMarried: newMember.isMarried,
          zellePhone: newMember.zellePhone.trim() || undefined,
          wifeZellePhone: newMember.wifeZellePhone.trim() || undefined,
          addressLine1: newMember.addressLine1.trim() || undefined,
          addressLine2: newMember.addressLine2.trim() || undefined,
          city: newMember.city.trim() || undefined,
          stateRegion: newMember.stateRegion.trim() || undefined,
          postalCode: newMember.postalCode.trim() || undefined,
          email: newMember.email.trim() || undefined,
          spouseEmail: newMember.spouseEmail.trim() || undefined,
          paypalAccount: newMember.paypalAccount.trim() || undefined,
          achRoutingNumber: newMember.achRoutingNumber.trim() || undefined,
          achAccountNumber: newMember.achAccountNumber.trim() || undefined,
          spousePhone:
            newMember.spousePhoneDigits.length === 10
              ? newMember.spousePhoneDigits
              : undefined,
        }),
      })
      setMemberConfirm(
        `Saved: ${r.displayName} · Phone ${r.phone} · Punch-in ${r.attendanceCode}`
      )
      setNewMember(emptyMemberForm())
      await load()
    } catch (e: unknown) {
      setMemberMsg(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function saveRabbiBanner() {
    if (!token) return
    setRabbiBannerMsg(null)
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ rabbiBanner: rabbiDraft.trim() || null }),
      })
      setRabbiBannerMsg(
        'Banner saved. Members see it after they refresh the app.'
      )
      await load()
    } catch (e: unknown) {
      setRabbiBannerMsg(e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function toggleLock() {
    if (!token || !treasury) return
    await api('/api/admin/treasury/lock', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ systemLocked: !treasury.systemLocked }),
    })
    await load()
  }

  async function downloadWeekPayoutCsv() {
    if (!token) return
    setExportMsg(null)
    try {
      const blob = await fetchBlob(
        `/api/admin/export/week/${weekExportDate}.csv`,
        { token }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `minyan-payouts-${weekExportDate}.csv`
      a.rel = 'noopener'
      a.click()
      URL.revokeObjectURL(url)
      setExportMsg('Download started.')
    } catch (e: unknown) {
      setExportMsg(e instanceof Error ? e.message : 'Export failed')
    }
  }

  if (!token) return null

  const tabBtn = (id: typeof adminTab, label: string) => {
    const on = adminTab === id
    return (
      <button
        key={id}
        type="button"
        className={`rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium leading-tight sm:text-xs ${
          on
            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
        onClick={() => setAdminTab(id)}
      >
        {label}
      </button>
    )
  }

  const checkedInCount = session?.attendances.length ?? 0
  const pendingApprovalCount = members.filter((m) => !m.isApproved).length
  const punchInTakenAdd = useMemo(
    () => isPunchInCodeTaken(members, newMember.attendanceCode),
    [members, newMember.attendanceCode]
  )
  const punchInTakenEdit = useMemo(
    () =>
      editMember
        ? isPunchInCodeTaken(members, editForm.attendanceCode, editMember.id)
        : false,
    [members, editForm.attendanceCode, editMember]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/"
          className="text-[11px] text-slate-500 hover:text-slate-700 sm:text-xs"
        >
          ← Home
        </Link>
        <button
          type="button"
          className="text-[11px] text-slate-500 sm:text-xs"
          onClick={() => {
            localStorage.removeItem(KEY)
            nav('/admin')
          }}
        >
          Log out
        </button>
      </div>
      <div>
        <h1 className="text-lg font-semibold leading-tight sm:text-xl">
          Admin
        </h1>
        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
          {adminTab === 'overview' && 'Treasury, banner, export'}
          {adminTab === 'members' && `All members in database (${members.length})`}
          {adminTab === 'today' &&
            (session
              ? `Checked in · ${session.dateKey} (${checkedInCount})`
              : 'Loading…')}
          {adminTab === 'add' && 'Create a new member'}
          {adminTab === 'checkio' &&
            `Check-in/out transactions (${attendanceTxns.length})`}
        </p>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}

      <nav className="grid grid-cols-2 gap-2" aria-label="Admin sections">
        {tabBtn('overview', 'Overview')}
        {tabBtn(
          'members',
          pendingApprovalCount
            ? `All members (${pendingApprovalCount} pending)`
            : 'All members'
        )}
        {tabBtn('today', "Today's check-ins")}
        {tabBtn('add', 'Add member')}
        {tabBtn('checkio', 'Check-in/out')}
      </nav>

      {pendingApprovalCount > 0 && (
        <div
          className="animate-pulse rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-950 ring-1 ring-amber-200/80 sm:text-xs"
          role="status"
        >
          {pendingApprovalCount} member
          {pendingApprovalCount === 1 ? '' : 's'} waiting for approval — open{' '}
          <button
            type="button"
            className="text-amber-900 underline decoration-amber-700/60"
            onClick={() => setAdminTab('members')}
          >
            All members
          </button>{' '}
          to review.
        </div>
      )}

      {adminTab === 'overview' && (
        <>
          {treasury && (
            <div className="rounded-md border border-slate-200 bg-slate-50 ring-1 ring-slate-100 p-3 text-xs sm:text-sm">
              <p>
                Treasury:{' '}
                <strong>${(treasury.balanceCents / 100).toFixed(2)}</strong>
              </p>
              <p className="text-slate-400">
                Locked: {treasury.systemLocked ? 'yes' : 'no'}
              </p>
              <button
                type="button"
                className="mt-2 text-blue-600/90 hover:underline"
                onClick={() => void toggleLock()}
              >
                Toggle lock
              </button>
              <form onSubmit={addFunds} className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="Add USD"
                  value={fund}
                  onChange={(e) => setFund(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded bg-slate-700 px-3 py-1 text-sm"
                >
                  Fund
                </button>
              </form>
            </div>
          )}

      {settings && (
        <p className="text-xs text-slate-500">
          First {settings.firstNineSlots}: $
          {(settings.firstNineCents / 100).toFixed(2)} / day · Full week bonus: $
          {(settings.weeklyBonusCents / 100).toFixed(2)}
        </p>
      )}

      {settings && (
        <div className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-xs sm:text-sm">
          <h2 className="mb-2 font-medium text-blue-900/95 sm:text-sm">
            Message from the Rabbi (banner on all pages)
          </h2>
          <textarea
            className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-slate-200"
            rows={3}
            maxLength={2000}
            placeholder="Short message for all members…"
            value={rabbiDraft}
            onChange={(e) => setRabbiDraft(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => void saveRabbiBanner()}
          >
            Save banner
          </button>
          {rabbiBannerMsg && (
            <p className="mt-2 text-[11px] text-slate-400">{rabbiBannerMsg}</p>
          )}
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
        <h2 className="mb-1.5 text-xs font-medium text-slate-700 sm:text-sm">
          Weekly payout export
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Week (any day)
            <input
              type="date"
              className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-200"
              value={weekExportDate}
              onChange={(e) => setWeekExportDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
            onClick={() => void downloadWeekPayoutCsv()}
          >
            Download CSV
          </button>
        </div>
        {exportMsg && (
          <p className="mt-2 text-xs text-slate-400">{exportMsg}</p>
        )}
      </div>

          <div className="rounded-md border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 sm:text-xs">
            <span className="font-medium text-slate-800">Today&apos;s check-ins: </span>
            {checkedInCount} —{' '}
            <button
              type="button"
              className="text-blue-600 underline decoration-blue-600/30"
              onClick={() => setAdminTab('today')}
            >
              open dashboard
            </button>
          </div>
        </>
      )}

      {adminTab === 'members' && (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
        <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
          All members ({members.length})
        </h2>
        <p className="mb-2 text-[11px] text-slate-500 sm:text-xs">
          View full record, edit and save changes, or delete a member.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-md border border-slate-200/90 bg-slate-50 px-2.5 py-2 text-[11px] leading-snug text-slate-700 sm:text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {m.displayName}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500 sm:text-[11px]">
                    {m.phone} · punch-in {m.attendanceCode}
                  </p>
                  <p className="mt-0.5">
                    {m.isApproved ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-blue-600">Pending</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    className="text-blue-600/90 active:underline"
                    onClick={() => setViewMember(m)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="text-slate-700 active:underline"
                    onClick={() => openEdit(m)}
                  >
                    Edit / save
                  </button>
                  <button
                    type="button"
                    className="text-red-700/90 active:underline"
                    onClick={() => void deleteMember(m.id)}
                  >
                    Delete
                  </button>
                  {!m.isApproved && (
                    <button
                      type="button"
                      className="text-emerald-600 active:underline"
                      onClick={() => void approveMember(m.id)}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {members.length === 0 && (
          <p className="text-xs text-slate-500">No members yet.</p>
        )}
      </div>
      )}

      {adminTab === 'add' && (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
        <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
          Add member
        </h2>
        <form onSubmit={createMember} className="grid gap-2 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-slate-200 bg-white px-2 py-1"
              placeholder="First name"
              value={newMember.firstName}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, firstName: e.target.value }))
              }
              required
            />
            <input
              className="rounded border border-slate-200 bg-white px-2 py-1"
              placeholder="Last name"
              value={newMember.lastName}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, lastName: e.target.value }))
              }
              required
            />
          </div>
          <label className="text-xs text-slate-400">
            Phone
            <PhoneInput
              className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
              value={newMember.phoneDigits}
              onChange={(d) =>
                setNewMember((m) => ({ ...m, phoneDigits: d }))
              }
              required
            />
          </label>
          <label className="text-xs text-slate-600">
            Login PIN (4+ digits; sign in with phone + PIN — PIN is not globally
            unique)
            <input
              className={`mt-1 w-full rounded border bg-white px-2 py-1 ${
                newMember.pin.length > 0 && newMember.pin.length < 4
                  ? 'border-red-500 ring-1 ring-red-200'
                  : 'border-slate-200'
              }`}
              placeholder="Login PIN"
              value={newMember.pin}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, pin: e.target.value }))
              }
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>
          <label className="text-xs text-slate-600">
            Punch-in code (unique — used on Punch in screen)
            <input
              className={`mt-1 w-full rounded border bg-white px-2 py-1 font-mono ${
                punchInTakenAdd
                  ? 'border-red-500 ring-1 ring-red-200'
                  : 'border-slate-200'
              }`}
              placeholder="Punch-in code"
              value={newMember.attendanceCode}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, attendanceCode: e.target.value }))
              }
              required
              minLength={4}
            />
          </label>
          {punchInTakenAdd && (
            <p className="text-xs text-red-600">
              That punch-in code is already in use. Choose another.
            </p>
          )}
          <p className="text-xs text-slate-500">Address</p>
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="Street line 1"
            value={newMember.addressLine1}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, addressLine1: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="Street line 2"
            value={newMember.addressLine2}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, addressLine2: e.target.value }))
            }
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className="rounded border border-slate-200 bg-white px-2 py-1"
              placeholder="City"
              value={newMember.city}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, city: e.target.value }))
              }
            />
            <input
              className="rounded border border-slate-200 bg-white px-2 py-1"
              placeholder="State"
              value={newMember.stateRegion}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, stateRegion: e.target.value }))
              }
            />
            <input
              className="rounded border border-slate-200 bg-white px-2 py-1"
              placeholder="ZIP"
              value={newMember.postalCode}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, postalCode: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              checked={newMember.isMarried}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, isMarried: e.target.checked }))
              }
            />
            Married
          </label>
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="Zelle phone (optional)"
            value={newMember.zellePhone}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, zellePhone: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="Spouse Zelle (optional)"
            value={newMember.wifeZellePhone}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, wifeZellePhone: e.target.value }))
            }
          />
          <p className="text-xs text-slate-500">Contact &amp; payment (optional)</p>
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={newMember.email}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, email: e.target.value }))
            }
          />
          <label className="text-xs text-slate-400">
            Spouse phone
            <PhoneInput
              className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
              value={newMember.spousePhoneDigits}
              onChange={(d) =>
                setNewMember((m) => ({ ...m, spousePhoneDigits: d }))
              }
            />
          </label>
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            type="email"
            autoComplete="off"
            placeholder="Spouse email"
            value={newMember.spouseEmail}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, spouseEmail: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="PayPal email or ID"
            value={newMember.paypalAccount}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, paypalAccount: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="ACH routing #"
            inputMode="numeric"
            value={newMember.achRoutingNumber}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, achRoutingNumber: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="ACH account #"
            inputMode="numeric"
            autoComplete="off"
            value={newMember.achAccountNumber}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, achAccountNumber: e.target.value }))
            }
          />
          <button
            type="submit"
            disabled={punchInTakenAdd}
            className="rounded bg-slate-700 py-2 font-medium hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save member
          </button>
        </form>
        {memberConfirm && (
          <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            {memberConfirm}
          </p>
        )}
        {memberMsg && memberMsg !== memberConfirm && (
          <p className="mt-2 text-xs text-slate-400">{memberMsg}</p>
        )}
      </div>
      )}

      {adminTab === 'today' && session && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
          <h2 className="mb-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            Checked in today ({session.attendances.length}) · {session.dateKey}
          </h2>
          <p className="mb-3 text-[11px] text-slate-500 sm:text-xs">
            Same controls as All members: view full DB record, edit and save, or
            delete. Pending punch-ins must be confirmed or rejected first.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {session.attendances.map((a) => {
              const row = memberRowForUserId(a.user.id)
              return (
                <li
                  key={a.id}
                  className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] leading-snug sm:text-xs"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {a.user.displayName}
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        {new Date(a.punchInAt).toLocaleString()} ·{' '}
                        <span
                          className={
                            a.punchInStatus === 'CONFIRMED'
                              ? 'text-emerald-700'
                              : a.punchInStatus === 'PENDING'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }
                        >
                          {a.punchInStatus}
                        </span>
                        {a.punchOutAt
                          ? ` · out ${new Date(a.punchOutAt).toLocaleTimeString()}`
                          : ' · no punch-out'}
                      </p>
                      {a.punchInStatus === 'CONFIRMED' && (
                        <p className="mt-1 text-[10px] text-blue-700/85 sm:text-[11px]">
                          First-nine:{' '}
                          {a.wouldBeFirstNine ? 'yes (day rate)' : 'no'}
                        </p>
                      )}
                    </div>
                    {a.punchInStatus === 'PENDING' && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="rounded bg-emerald-800 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-700 sm:text-xs"
                          onClick={() => void confirm(a.id)}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="rounded bg-slate-700 px-2.5 py-1 text-[11px] text-white hover:bg-slate-600 sm:text-xs"
                          onClick={() => void reject(a.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {row && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-200/90 pt-2 text-[11px] sm:text-xs">
                        <button
                          type="button"
                          className="text-blue-600/95 hover:underline"
                          onClick={() => setViewMember(row)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="text-slate-700 hover:underline"
                          onClick={() => openEdit(row)}
                        >
                          Edit / save
                        </button>
                        <button
                          type="button"
                          className="text-red-700/90 hover:underline"
                          onClick={() => void deleteMember(row.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {session.attendances.length === 0 && (
            <p className="text-xs text-slate-500">No punch-ins yet today.</p>
          )}
        </div>
      )}

      {adminTab === 'checkio' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
          <h2 className="mb-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            Check-in/out transactions ({attendanceTxns.length})
          </h2>
          <p className="mb-3 text-[11px] text-slate-500 sm:text-xs">
            View, edit/save, or delete recorded attendance transactions from the
            database.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {attendanceTxns.map((tx) => (
              <li
                key={tx.id}
                className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] leading-snug sm:text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {tx.userDisplayName}
                    </p>
                    <p className="truncate font-mono text-[10px] text-slate-500 sm:text-[11px]">
                      {tx.userPhone} · {tx.userPunchInCode}
                    </p>
                    <p className="mt-1 text-slate-600">
                      In: {new Date(tx.punchInAt).toLocaleString()}
                    </p>
                    <p className="text-slate-600">
                      Out:{' '}
                      {tx.punchOutAt
                        ? new Date(tx.punchOutAt).toLocaleString()
                        : '—'}
                    </p>
                    <p className="text-slate-500">
                      Session: {tx.sessionDateKey || '—'} · Status:{' '}
                      <span
                        className={
                          tx.punchInStatus === 'CONFIRMED'
                            ? 'text-emerald-700'
                            : tx.punchInStatus === 'PENDING'
                              ? 'text-amber-700'
                              : 'text-slate-700'
                        }
                      >
                        {tx.punchInStatus}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      className="text-slate-700 hover:underline"
                      onClick={() => openEditTxn(tx)}
                    >
                      Edit / save
                    </button>
                    <button
                      type="button"
                      className="text-red-700/90 hover:underline"
                      onClick={() => void deleteTxn(tx.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {attendanceTxns.length === 0 && (
            <p className="text-xs text-slate-500">No transactions found.</p>
          )}
        </div>
      )}

      {viewMember && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[min(90dvh,100%)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
                {viewMember.displayName}
              </h3>
              <div className="flex shrink-0 items-start gap-3">
                <div className="text-right">
                  <span className="block text-[11px] text-slate-500">
                    Member since
                  </span>
                  <span className="block max-w-[11rem] whitespace-normal text-[11px] font-medium leading-snug text-slate-600 sm:max-w-none sm:whitespace-nowrap">
                    {new Date(viewMember.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  className={MODAL_TEXT_BTN}
                  onClick={() => setViewMember(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <dl className="space-y-0 divide-y divide-slate-100 text-slate-700">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-right text-slate-900">{viewMember.phone}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Login PIN</dt>
                <dd className="text-right text-slate-600">
                  Set (stored encrypted — use Edit to change)
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Punch-in code</dt>
                <dd className="text-right font-mono text-slate-900">
                  {viewMember.attendanceCode}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Status</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.isApproved ? 'Active' : 'Pending approval'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Address</dt>
                <dd
                  className="min-w-0 max-w-[min(100%,20rem)] truncate text-right text-slate-900"
                  title={[
                    [viewMember.addressLine1, viewMember.addressLine2]
                      .filter(Boolean)
                      .join(', '),
                    [
                      viewMember.city,
                      viewMember.stateRegion,
                      viewMember.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                >
                  {(() => {
                    const cityLine = [
                      viewMember.city,
                      viewMember.stateRegion,
                      viewMember.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')
                    const streetLine = [
                      viewMember.addressLine1,
                      viewMember.addressLine2,
                    ]
                      .filter(Boolean)
                      .join(', ')
                    const one = [streetLine, cityLine].filter(Boolean).join(' · ')
                    return one || '—'
                  })()}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Zelle</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.zellePhone || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Spouse Zelle</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.wifeZellePhone || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Email</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.email || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Spouse phone</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.spousePhone || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">Spouse email</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.spouseEmail || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">PayPal</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.paypalAccount || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">ACH routing</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.achRoutingNumber || '—'}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">ACH account</dt>
                <dd className="text-right text-slate-900">
                  {maskBankTail(viewMember.achAccountNumber)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] text-slate-500 sm:text-[11px]">
              Sign-in uses <strong>phone + login PIN</strong> (PIN is not unique by
              itself). Punch-in at the kiosk uses the <strong>punch-in code</strong>{' '}
              only.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  openEdit(viewMember)
                  setViewMember(null)
                }}
              >
                Edit / save
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-medium text-red-900 hover:bg-red-100"
                onClick={() => void deleteMember(viewMember.id)}
              >
                Delete member
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2.5 sm:ml-auto ${MODAL_TEXT_BTN}`}
                onClick={() => setViewMember(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Edit member
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => setEditMember(null)}
              >
                Cancel
              </button>
            </div>
            <form onSubmit={saveEdit} className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="First name"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="Last name"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>
              <label className="text-xs text-slate-400">
                Phone
                <PhoneInput
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editForm.phoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, phoneDigits: d }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                Login PIN (sign in with phone + PIN; leave blank to keep)
                <input
                  type="password"
                  className={`mt-1 w-full rounded border bg-white px-2 py-1 ${
                    editPin.length > 0 && editPin.length < 4
                      ? 'border-red-500 ring-1 ring-red-200'
                      : 'border-slate-200'
                  }`}
                  placeholder="New PIN (4+ digits)"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="text-xs text-slate-600">
                Punch-in code (unique — used at Punch in screen)
                <input
                  className={`mt-1 w-full rounded border bg-white px-2 py-1 font-mono ${
                    punchInTakenEdit
                      ? 'border-red-500 ring-1 ring-red-200'
                      : 'border-slate-200'
                  }`}
                  placeholder="Punch-in code"
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
              {punchInTakenEdit && (
                <p className="text-xs text-red-600">
                  That punch-in code is already in use. Choose another.
                </p>
              )}
              <p className="text-xs text-slate-500">Address</p>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="Street line 1"
                value={editForm.addressLine1}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine1: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="Street line 2"
                value={editForm.addressLine2}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine2: e.target.value }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="City"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="State"
                  value={editForm.stateRegion}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, stateRegion: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder="ZIP"
                  value={editForm.postalCode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, postalCode: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  checked={editForm.isMarried}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, isMarried: e.target.checked }))
                  }
                />
                Married
              </label>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="Zelle"
                value={editForm.zellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, zellePhone: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="Spouse Zelle"
                value={editForm.wifeZellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, wifeZellePhone: e.target.value }))
                }
              />
              <p className="text-xs text-slate-500">Contact &amp; payment</p>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <label className="text-xs text-slate-400">
                Spouse phone
                <PhoneInput
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editForm.spousePhoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, spousePhoneDigits: d }))
                  }
                />
              </label>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                type="email"
                placeholder="Spouse email"
                value={editForm.spouseEmail}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, spouseEmail: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="PayPal email or ID"
                value={editForm.paypalAccount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, paypalAccount: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="ACH routing #"
                inputMode="numeric"
                value={editForm.achRoutingNumber}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    achRoutingNumber: e.target.value,
                  }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="ACH account #"
                inputMode="numeric"
                autoComplete="off"
                value={editForm.achAccountNumber}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    achAccountNumber: e.target.value,
                  }))
                }
              />
              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  checked={editMember.isApproved}
                  onChange={(e) =>
                    setEditMember((m) =>
                      m ? { ...m, isApproved: e.target.checked } : m
                    )
                  }
                />
                Approved (active)
              </label>
              <button
                type="submit"
                disabled={punchInTakenEdit}
                className="rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save changes
              </button>
              <button
                type="button"
                className="rounded border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
                onClick={() => void deleteMember(editMember.id)}
              >
                Delete member
              </button>
            </form>
            {editSaveMsg && (
              <p className="mt-2 text-xs text-red-600">{editSaveMsg}</p>
            )}
          </div>
        </div>
      )}

      {editTxn && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Edit check-in/out
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => setEditTxn(null)}
              >
                Cancel
              </button>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {editTxn.userDisplayName} · {editTxn.userPhone}
            </p>
            <form onSubmit={saveEditTxn} className="grid gap-2">
              <label className="text-xs text-slate-600">
                Punch-in datetime
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchInAtLocal}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({ ...f, punchInAtLocal: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                Punch-out datetime (optional)
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchOutAtLocal}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({ ...f, punchOutAtLocal: e.target.value }))
                  }
                />
              </label>
              <label className="text-xs text-slate-600">
                Status
                <select
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchInStatus}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({
                      ...f,
                      punchInStatus: e.target.value as
                        | 'PENDING'
                        | 'CONFIRMED'
                        | 'REJECTED',
                    }))
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
              >
                Save changes
              </button>
              <button
                type="button"
                className="rounded border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
                onClick={() => void deleteTxn(editTxn.id)}
              >
                Delete transaction
              </button>
            </form>
            {editTxnMsg && (
              <p className="mt-2 text-xs text-red-600">{editTxnMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

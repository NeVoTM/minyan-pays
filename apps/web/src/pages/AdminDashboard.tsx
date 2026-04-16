import { useCallback, useEffect, useState } from 'react'
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

  const load = useCallback(async () => {
    if (!token) {
      nav('/admin')
      return
    }
    try {
      const [s, t, st, m] = await Promise.all([
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
      ])
      setSession(s)
      setTreasury(t)
      setSettings(st)
      setRabbiDraft(st.rabbiBanner ?? '')
      setMembers(m)
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
        `Saved: ${r.displayName} · Phone ${r.phone} · Code ${r.attendanceCode}`
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
      <h1 className="text-lg font-semibold leading-tight sm:text-xl">
        Today&apos;s minyan
      </h1>
      {err && <p className="text-xs text-red-600">{err}</p>}

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

      <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
        <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
          Members ({members.length})
        </h2>
        <ul className="space-y-2">
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
                    {m.phone} · {m.attendanceCode}
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
                    className="text-slate-400 active:underline"
                    onClick={() => openEdit(m)}
                  >
                    Edit
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
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="PIN (4+ digits)"
            value={newMember.pin}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, pin: e.target.value }))
            }
            required
          />
          <input
            className="rounded border border-slate-200 bg-white px-2 py-1"
            placeholder="Attendance code (unique)"
            value={newMember.attendanceCode}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, attendanceCode: e.target.value }))
            }
            required
          />
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
            className="rounded bg-slate-700 py-2 font-medium hover:bg-slate-600"
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

      {session && (
        <ul className="space-y-2">
          {session.attendances.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-2.5 text-xs sm:text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.user.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.punchInAt).toLocaleString()} ·{' '}
                    {a.punchInStatus}
                    {a.punchOutAt
                      ? ` · out ${new Date(a.punchOutAt).toLocaleTimeString()}`
                      : ' · no punch-out'}
                  </p>
                  {a.punchInStatus === 'CONFIRMED' && (
                    <p className="text-xs text-blue-700/80">
                      First-nine slot if confirmed order:{' '}
                      {a.wouldBeFirstNine ? 'yes (earning day rate)' : 'no'}
                    </p>
                  )}
                </div>
                {a.punchInStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-emerald-800 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                      onClick={() => void confirm(a.id)}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
                      onClick={() => void reject(a.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {session.attendances.length === 0 && (
            <li className="text-slate-500">No punch-ins yet today.</li>
          )}
        </ul>
      )}

      {viewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {viewMember.displayName}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200"
                onClick={() => setViewMember(null)}
              >
                Close
              </button>
            </div>
            <dl className="grid gap-2 text-slate-700">
              <dt className="text-slate-500">Phone</dt>
              <dd>{viewMember.phone}</dd>
              <dt className="text-slate-500">Attendance code</dt>
              <dd className="font-mono">{viewMember.attendanceCode}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{viewMember.isApproved ? 'Active' : 'Pending approval'}</dd>
              <dt className="text-slate-500">Address</dt>
              <dd>{viewMember.addressLine1 || '—'}</dd>
              <dd>{viewMember.addressLine2 || ''}</dd>
              <dd>
                {[viewMember.city, viewMember.stateRegion, viewMember.postalCode]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
              <dt className="text-slate-500">Zelle</dt>
              <dd>{viewMember.zellePhone || '—'}</dd>
              <dt className="text-slate-500">Spouse Zelle</dt>
              <dd>{viewMember.wifeZellePhone || '—'}</dd>
              <dt className="text-slate-500">Email</dt>
              <dd>{viewMember.email || '—'}</dd>
              <dt className="text-slate-500">Spouse phone</dt>
              <dd>{viewMember.spousePhone || '—'}</dd>
              <dt className="text-slate-500">Spouse email</dt>
              <dd>{viewMember.spouseEmail || '—'}</dd>
              <dt className="text-slate-500">PayPal</dt>
              <dd>{viewMember.paypalAccount || '—'}</dd>
              <dt className="text-slate-500">ACH routing</dt>
              <dd>{viewMember.achRoutingNumber || '—'}</dd>
              <dt className="text-slate-500">ACH account</dt>
              <dd>{maskBankTail(viewMember.achAccountNumber)}</dd>
            </dl>
            <button
              type="button"
              className="mt-4 w-full rounded bg-slate-700 py-2 hover:bg-slate-600"
              onClick={() => setViewMember(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Edit member
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200"
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
              <input
                type="password"
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="New PIN (leave blank to keep)"
                value={editPin}
                onChange={(e) => setEditPin(e.target.value)}
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder="Attendance code"
                value={editForm.attendanceCode}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    attendanceCode: e.target.value,
                  }))
                }
                required
              />
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
                className="rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
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
    </div>
  )
}

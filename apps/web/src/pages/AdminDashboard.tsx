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
  }
}

function phoneDigitsFromE164(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^1/, '').slice(0, 10)
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
    firstNineCents: number
    weeklyBonusCents: number
    firstNineSlots: number
  } | null>(null)
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
          firstNineCents: number
          weeklyBonusCents: number
          firstNineSlots: number
        }>('/api/admin/settings', { token }),
        api<MemberRow[]>('/api/admin/members', { token }),
      ])
      setSession(s)
      setTreasury(t)
      setSettings(st)
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
            nav('/admin')
          }}
        >
          Log out
        </button>
      </div>
      <h1 className="text-xl font-semibold">Today&apos;s minyan</h1>
      {err && <p className="text-sm text-red-400">{err}</p>}

      {treasury && (
        <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4 text-sm">
          <p>
            Treasury:{' '}
            <strong>${(treasury.balanceCents / 100).toFixed(2)}</strong>
          </p>
          <p className="text-slate-400">
            Locked: {treasury.systemLocked ? 'yes' : 'no'}
          </p>
          <button
            type="button"
            className="mt-2 text-amber-400/90 hover:underline"
            onClick={() => void toggleLock()}
          >
            Toggle lock
          </button>
          <form onSubmit={addFunds} className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded border border-slate-600 bg-slate-950 px-2 py-1"
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

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">
          Weekly payout export
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Week (any day)
            <input
              type="date"
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-slate-200"
              value={weekExportDate}
              onChange={(e) => setWeekExportDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded bg-amber-900/50 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/70"
            onClick={() => void downloadWeekPayoutCsv()}
          >
            Download CSV
          </button>
        </div>
        {exportMsg && (
          <p className="mt-2 text-xs text-slate-400">{exportMsg}</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Phone</th>
                <th className="py-2 pr-2">Code</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-800/80">
                  <td className="py-2 pr-2 font-medium text-slate-200">
                    {m.displayName}
                  </td>
                  <td className="py-2 pr-2">{m.phone}</td>
                  <td className="py-2 pr-2 font-mono">{m.attendanceCode}</td>
                  <td className="py-2 pr-2">
                    {m.isApproved ? (
                      <span className="text-emerald-400">Active</span>
                    ) : (
                      <span className="text-amber-400">Pending</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="text-amber-400/90 hover:underline"
                        onClick={() => setViewMember(m)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="text-slate-400 hover:underline"
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </button>
                      {!m.isApproved && (
                        <button
                          type="button"
                          className="text-emerald-400 hover:underline"
                          onClick={() => void approveMember(m.id)}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 0 && (
          <p className="text-xs text-slate-500">No members yet.</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Add member</h2>
        <form onSubmit={createMember} className="grid gap-2 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
              placeholder="First name"
              value={newMember.firstName}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, firstName: e.target.value }))
              }
              required
            />
            <input
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
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
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
              value={newMember.phoneDigits}
              onChange={(d) =>
                setNewMember((m) => ({ ...m, phoneDigits: d }))
              }
              required
            />
          </label>
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="PIN (4+ digits)"
            value={newMember.pin}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, pin: e.target.value }))
            }
            required
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Attendance code (unique)"
            value={newMember.attendanceCode}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, attendanceCode: e.target.value }))
            }
            required
          />
          <p className="text-xs text-slate-500">Address</p>
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Street line 1"
            value={newMember.addressLine1}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, addressLine1: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Street line 2"
            value={newMember.addressLine2}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, addressLine2: e.target.value }))
            }
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
              placeholder="City"
              value={newMember.city}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, city: e.target.value }))
              }
            />
            <input
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
              placeholder="State"
              value={newMember.stateRegion}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, stateRegion: e.target.value }))
              }
            />
            <input
              className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
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
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Zelle phone (optional)"
            value={newMember.zellePhone}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, zellePhone: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Spouse Zelle (optional)"
            value={newMember.wifeZellePhone}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, wifeZellePhone: e.target.value }))
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
          <p className="mt-3 rounded border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-100">
            {memberConfirm}
          </p>
        )}
        {memberMsg && memberMsg !== memberConfirm && (
          <p className="mt-2 text-xs text-slate-400">{memberMsg}</p>
        )}
      </div>

      {session && (
        <ul className="space-y-3">
          {session.attendances.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-3"
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
                    <p className="text-xs text-amber-200/80">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 p-6 text-sm shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
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
            <dl className="grid gap-2 text-slate-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 p-6 text-sm shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
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
                  className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  placeholder="First name"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
                <input
                  className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
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
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  value={editForm.phoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, phoneDigits: d }))
                  }
                  required
                />
              </label>
              <input
                type="password"
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                placeholder="New PIN (leave blank to keep)"
                value={editPin}
                onChange={(e) => setEditPin(e.target.value)}
              />
              <input
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
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
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                placeholder="Street line 1"
                value={editForm.addressLine1}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine1: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                placeholder="Street line 2"
                value={editForm.addressLine2}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine2: e.target.value }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  placeholder="City"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  placeholder="State"
                  value={editForm.stateRegion}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, stateRegion: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
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
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                placeholder="Zelle"
                value={editForm.zellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, zellePhone: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                placeholder="Spouse Zelle"
                value={editForm.wifeZellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, wifeZellePhone: e.target.value }))
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
                className="rounded bg-amber-800/80 py-2 font-medium text-amber-50 hover:bg-amber-700"
              >
                Save changes
              </button>
            </form>
            {editSaveMsg && (
              <p className="mt-2 text-xs text-red-400">{editSaveMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

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
    user: { id: string; name: string; phone: string; attendanceCode: string }
  }[]
}

export function AdminDashboard() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [session, setSession] = useState<SessionResp | null>(null)
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
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    pin: '',
    attendanceCode: '',
    isMarried: false,
    zellePhone: '',
    wifeZellePhone: '',
  })
  const [memberMsg, setMemberMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      nav('/admin')
      return
    }
    try {
      const [s, t, st] = await Promise.all([
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
      ])
      setSession(s)
      setTreasury(t)
      setSettings(st)
      setErr(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Load failed')
    }
  }, [token, nav])

  useEffect(() => {
    void load()
  }, [load])

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
    try {
      await api('/api/admin/members', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: newMember.name,
          phone: newMember.phone,
          pin: newMember.pin,
          attendanceCode: newMember.attendanceCode,
          isMarried: newMember.isMarried,
          zellePhone: newMember.zellePhone || undefined,
          wifeZellePhone: newMember.wifeZellePhone || undefined,
        }),
      })
      setMemberMsg('Member created.')
      setNewMember({
        name: '',
        phone: '',
        pin: '',
        attendanceCode: '',
        isMarried: false,
        zellePhone: '',
        wifeZellePhone: '',
      })
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
        <h2 className="mb-3 text-sm font-medium text-slate-300">Add member</h2>
        <form onSubmit={createMember} className="grid gap-2 text-sm">
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Name"
            value={newMember.name}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, name: e.target.value }))
            }
            required
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="Phone"
            value={newMember.phone}
            onChange={(e) =>
              setNewMember((m) => ({ ...m, phone: e.target.value }))
            }
            required
          />
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
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              checked={newMember.isMarried}
              onChange={(e) =>
                setNewMember((m) => ({ ...m, isMarried: e.target.checked }))
              }
            />
            Married (bonus recipient fields)
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
            placeholder="Wife Zelle (optional)"
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
        {memberMsg && (
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
                  <p className="font-medium">{a.user.name}</p>
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
    </div>
  )
}

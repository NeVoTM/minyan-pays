import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { PhoneInput } from '../components/PhoneInput'

const empty = () => ({
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
})

export function MemberSignup() {
  const [f, setF] = useState(() => empty())
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (f.phoneDigits.length !== 10) {
      setErr('Enter a valid 10-digit US phone number.')
      return
    }
    setLoading(true)
    try {
      const r = await api<{
        message: string
        displayName: string
        attendanceCode: string
      }>('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: f.firstName.trim(),
          lastName: f.lastName.trim(),
          phone: f.phoneDigits,
          pin: f.pin,
          attendanceCode: f.attendanceCode.trim(),
          isMarried: f.isMarried,
          zellePhone: f.zellePhone.trim() || undefined,
          wifeZellePhone: f.wifeZellePhone.trim() || undefined,
          addressLine1: f.addressLine1.trim() || undefined,
          addressLine2: f.addressLine2.trim() || undefined,
          city: f.city.trim() || undefined,
          stateRegion: f.stateRegion.trim() || undefined,
          postalCode: f.postalCode.trim() || undefined,
        }),
      })
      setMsg(
        `${r.message} Your attendance code: ${r.attendanceCode}. Save it — the rabbi will confirm when your account is approved.`
      )
      setF(empty())
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold">Member registration</h1>
      <p className="text-sm text-slate-400">
        Create your profile here. The rabbi must approve your account before you
        can sign in or punch in.
      </p>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {msg && (
        <p className="rounded border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {msg}
        </p>
      )}
      <form onSubmit={submit} className="grid gap-2 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-slate-400">
            First name
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
              value={f.firstName}
              onChange={(e) =>
                setF((x) => ({ ...x, firstName: e.target.value }))
              }
              required
            />
          </label>
          <label className="block text-slate-400">
            Last name
            <input
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
              value={f.lastName}
              onChange={(e) =>
                setF((x) => ({ ...x, lastName: e.target.value }))
              }
              required
            />
          </label>
        </div>
        <label className="block text-slate-400">
          Mobile phone
          <PhoneInput
            className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
            value={f.phoneDigits}
            onChange={(d) => setF((x) => ({ ...x, phoneDigits: d }))}
            required
          />
        </label>
        <label className="block text-slate-400">
          PIN (4+ digits)
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
            value={f.pin}
            onChange={(e) => setF((x) => ({ ...x, pin: e.target.value }))}
            required
            minLength={4}
          />
        </label>
        <label className="block text-slate-400">
          Choose attendance code (unique)
          <input
            className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1"
            value={f.attendanceCode}
            onChange={(e) =>
              setF((x) => ({ ...x, attendanceCode: e.target.value }))
            }
            required
            minLength={4}
          />
        </label>
        <p className="text-xs text-slate-500">Address</p>
        <input
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
          placeholder="Street line 1"
          value={f.addressLine1}
          onChange={(e) =>
            setF((x) => ({ ...x, addressLine1: e.target.value }))
          }
        />
        <input
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
          placeholder="Street line 2 (optional)"
          value={f.addressLine2}
          onChange={(e) =>
            setF((x) => ({ ...x, addressLine2: e.target.value }))
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="City"
            value={f.city}
            onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))}
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="State"
            value={f.stateRegion}
            onChange={(e) =>
              setF((x) => ({ ...x, stateRegion: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
            placeholder="ZIP"
            value={f.postalCode}
            onChange={(e) =>
              setF((x) => ({ ...x, postalCode: e.target.value }))
            }
          />
        </div>
        <label className="flex items-center gap-2 text-slate-400">
          <input
            type="checkbox"
            checked={f.isMarried}
            onChange={(e) =>
              setF((x) => ({ ...x, isMarried: e.target.checked }))
            }
          />
          Married (spouse Zelle for bonus)
        </label>
        <input
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
          placeholder="Your Zelle phone (optional)"
          value={f.zellePhone}
          onChange={(e) => setF((x) => ({ ...x, zellePhone: e.target.value }))}
        />
        <input
          className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
          placeholder="Spouse Zelle (optional)"
          value={f.wifeZellePhone}
          onChange={(e) =>
            setF((x) => ({ ...x, wifeZellePhone: e.target.value }))
          }
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-amber-700 py-2 font-medium text-slate-950 hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </div>
  )
}

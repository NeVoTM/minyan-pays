import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { PhoneInput } from '../components/PhoneInput'
import { formatPhoneDigits } from '../lib/phoneDisplay'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  pillTextarea,
  primaryBtn,
} from '../lib/uiClasses'

const empty = () => ({
  firstName: '',
  lastName: '',
  phoneDigits: '',
  pin: '',
  attendanceCode: '',
  email: '',
  isMarried: false,
  zelleDigits: '',
  wifeZelleDigits: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
})

function scrollFieldIntoView(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (t?.scrollIntoView) {
    t.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

export function MemberSignup() {
  const [f, setF] = useState(() => empty())
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [zipErr, setZipErr] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  function applyPhoneDefaults() {
    if (f.phoneDigits.length !== 10) return
    setF((x) => ({
      ...x,
      zelleDigits: x.zelleDigits ? x.zelleDigits : x.phoneDigits,
      wifeZelleDigits: x.wifeZelleDigits ? x.wifeZelleDigits : x.phoneDigits,
    }))
  }

  async function lookupZip() {
    setZipErr(null)
    const zip = f.postalCode.replace(/\D/g, '').slice(0, 5)
    if (zip.length !== 5) return
    setZipLoading(true)
    try {
      const r = await api<{ city: string; state: string }>(
        `/api/public/zip/${zip}`
      )
      setF((x) => ({
        ...x,
        city: r.city,
        stateRegion: r.state,
      }))
    } catch (e: unknown) {
      setZipErr(e instanceof Error ? e.message : 'ZIP lookup failed')
    } finally {
      setZipLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!agreeTerms) {
      setErr('Please agree to the terms to continue.')
      return
    }
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
          email: f.email.trim() || undefined,
          zellePhone: f.zelleDigits || undefined,
          wifeZellePhone: f.wifeZelleDigits || undefined,
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
      setAgreeTerms(false)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>Create an account</h1>
          <p className={pageSubtitle}>
            Join the minyan roster. The rabbi approves new members before punch-in.
          </p>
        </div>
      </div>

      {err && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {err}
        </p>
      )}
      {msg && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
          {msg}
        </p>
      )}

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>First name</span>
              <input
                className={pillInput}
                value={f.firstName}
                onChange={(e) =>
                  setF((x) => ({ ...x, firstName: e.target.value }))
                }
                onFocus={(e) => scrollFieldIntoView(e.target)}
                required
                placeholder="First name"
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>Last name</span>
              <input
                className={pillInput}
                value={f.lastName}
                onChange={(e) =>
                  setF((x) => ({ ...x, lastName: e.target.value }))
                }
                onFocus={(e) => scrollFieldIntoView(e.target)}
                required
                placeholder="Last name"
              />
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>Mobile phone</span>
            <PhoneInput
              className={pillInput}
              value={f.phoneDigits}
              onChange={(d) => setF((x) => ({ ...x, phoneDigits: d }))}
              onBlur={applyPhoneDefaults}
              required
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>PIN (4+ digits)</span>
            <input
              type="password"
              className={pillInput}
              value={f.pin}
              onChange={(e) => setF((x) => ({ ...x, pin: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Attendance code (unique)</span>
            <input
              className={pillInput}
              value={f.attendanceCode}
              onChange={(e) =>
                setF((x) => ({ ...x, attendanceCode: e.target.value }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              minLength={4}
              placeholder="Choose a code you will remember"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Email (optional)</span>
            <input
              type="email"
              autoComplete="email"
              className={pillInput}
              value={f.email}
              onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              placeholder="you@example.com"
            />
          </label>

          <div>
            <p className={fieldLabel}>Street address (max 100 chars / line)</p>
            <textarea
              className={pillTextarea}
              placeholder="Line 1"
              maxLength={100}
              rows={2}
              value={f.addressLine1}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  addressLine1: e.target.value.slice(0, 100),
                }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
            <textarea
              className={`${pillTextarea} mt-2`}
              placeholder="Line 2 (optional)"
              maxLength={100}
              rows={2}
              value={f.addressLine2}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  addressLine2: e.target.value.slice(0, 100),
                }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className={pillInput}
              placeholder="City"
              maxLength={80}
              value={f.city}
              onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
            <input
              className={pillInput}
              placeholder="State"
              maxLength={32}
              value={f.stateRegion}
              onChange={(e) =>
                setF((x) => ({ ...x, stateRegion: e.target.value }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
            <input
              className={pillInput}
              placeholder="ZIP"
              inputMode="numeric"
              maxLength={5}
              value={f.postalCode}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  postalCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                }))
              }
              onBlur={() => void lookupZip()}
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
          </div>
          {zipLoading && (
            <p className="text-[11px] text-slate-500">Looking up ZIP…</p>
          )}
          {zipErr && (
            <p className="text-[11px] text-amber-700">{zipErr}</p>
          )}

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={f.isMarried}
              onChange={(e) =>
                setF((x) => ({ ...x, isMarried: e.target.checked }))
              }
            />
            Married (spouse Zelle for bonus)
          </label>

          <label className="block">
            <span className={fieldLabel}>Your Zelle (optional)</span>
            <PhoneInput
              className={pillInput}
              placeholder={
                f.phoneDigits.length === 10
                  ? formatPhoneDigits(f.phoneDigits)
                  : '555-123-4567'
              }
              value={f.zelleDigits}
              onChange={(d) => setF((x) => ({ ...x, zelleDigits: d }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Spouse Zelle (optional)</span>
            <PhoneInput
              className={pillInput}
              placeholder={
                f.phoneDigits.length === 10
                  ? formatPhoneDigits(f.phoneDigits)
                  : '555-123-4567'
              }
              value={f.wifeZelleDigits}
              onChange={(d) => setF((x) => ({ ...x, wifeZelleDigits: d }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
            />
          </label>

          <label className="flex items-start gap-3 text-sm leading-snug text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <span className="font-semibold text-blue-600">
                terms &amp; conditions
              </span>{' '}
              and authorize text messages about minyan attendance and payouts.
            </span>
          </label>

          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link
          to="/member"
          className="font-semibold text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

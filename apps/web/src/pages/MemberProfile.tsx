import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { PhoneInput } from '../components/PhoneInput'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pinInput,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

const KEY = 'minyan_member_token'

/** `attendanceCode` is returned for kiosk check-in but not shown on this page. */
type Profile = {
  firstName: string
  lastName: string
  phone: string
  hasPin: boolean
  attendanceCode?: string
  zellePhone: string | null
  wifeZellePhone: string | null
  addressLine1: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
}

export function MemberProfile() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [form, setForm] = useState<Profile | null>(null)
  const [newPin, setNewPin] = useState('')
  const [showNewPin, setShowNewPin] = useState(false)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      nav('/member/login')
      return
    }
    api<Profile>('/api/me/profile', { token })
      .then(setForm)
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Load failed'))
  }, [token, nav])

  if (!token || !form) return null

  async function sendCode() {
    setMsg(null)
    try {
      const r = await api<{ ok: boolean; devCode?: string }>(
        '/api/me/profile/verification/send',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ purpose: 'PROFILE_CHANGE' }),
        }
      )
      setDevCode(r.devCode ?? null)
      setMsg('Verification code sent by text message.')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Send failed')
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setMsg(null)
    const digits = code.replace(/\D/g, '').slice(0, 6)
    if (digits.length !== 6) {
      setMsg('Enter the full 6-digit code. Tap Send code first if you have not received one.')
      return
    }
    if (newPin.trim() && newPin.trim().length < 4) {
      setMsg('New PIN must be at least 4 digits, or leave blank.')
      return
    }
    try {
      await api('/api/me/profile', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          zellePhone: form.zellePhone || null,
          wifeZellePhone: form.wifeZellePhone || null,
          addressLine1: form.addressLine1 || null,
          city: form.city || null,
          stateRegion: form.stateRegion || null,
          postalCode: form.postalCode || null,
          pin: newPin.trim() || undefined,
          verificationCode: digits,
        }),
      })
      setMsg('Profile updated.')
      setNewPin('')
      setCode('')
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Save failed'
      try {
        const o = JSON.parse(raw) as {
          fieldErrors?: Record<string, string[]>
          formErrors?: string[]
        }
        const parts = [
          ...(o.formErrors ?? []),
          ...Object.values(o.fieldErrors ?? {}).flat(),
        ]
        if (parts.length) {
          setMsg(parts.join(' '))
          return
        }
      } catch {
        /* plain string */
      }
      setMsg(raw)
    }
  }

  const sectionKicker = 'text-xs font-semibold uppercase tracking-wide text-slate-400'
  const sectionTitle = 'mt-1 font-semibold text-slate-900'
  const sectionHint = 'mt-0.5 text-xs text-slate-500'

  return (
    <form className="space-y-4" onSubmit={save}>
      <div className="flex items-start gap-3">
        <BackLink to="/member/app" />
        <div>
          <h1 className={pageTitle}>Member profile</h1>
          <p className={pageSubtitle}>View and update PIN, address, and Zelle details.</p>
        </div>
      </div>

      <div className={cardShell}>
        <p className={sectionKicker}>Account</p>
        <p className={sectionTitle}>Name &amp; phone</p>
        <p className={`${sectionHint} mb-4`}>These are read-only. Contact your admin if they need to change.</p>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={fieldLabel}>First name</span>
            <input className={pillInput} value={form.firstName} readOnly />
          </label>
          <label>
            <span className={fieldLabel}>Last name</span>
            <input className={pillInput} value={form.lastName} readOnly />
          </label>
        </div>
        <label className="mt-3 block">
          <span className={fieldLabel}>Phone</span>
          <input className={pillInput} value={form.phone} readOnly />
        </label>
      </div>

      <div className={cardShell}>
        <p className={sectionKicker}>Security</p>
        <p className={sectionTitle}>Login PIN</p>
        <p className={sectionHint}>
          {form.hasPin
            ? 'Your current PIN cannot be shown. Enter a new one to replace it.'
            : 'Choose a PIN for member login.'}
        </p>
        <label className="mt-3 block min-w-0">
          <span className={fieldLabel}>New login PIN (optional)</span>
          <div className="relative mt-0.5">
            <input
              className={`${pinInput} w-full pr-12`}
              type={showNewPin ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder={form.hasPin ? 'Change PIN' : 'Set PIN'}
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => setShowNewPin((v) => !v)}
            >
              {showNewPin ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
      </div>

      <div className={cardShell}>
        <p className={sectionKicker}>Payouts</p>
        <p className={sectionTitle}>Zelle numbers</p>
        <p className={sectionHint}>Used for attendance payouts.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block min-w-0">
            <span className={fieldLabel}>Zelle (you)</span>
            <PhoneInput
              className={pillInput}
              value={form.zellePhone ?? ''}
              onChange={(v) => setForm((p) => (p ? { ...p, zellePhone: v || null } : p))}
            />
          </label>
          <label className="block min-w-0">
            <span className={fieldLabel}>Zelle (spouse)</span>
            <PhoneInput
              className={pillInput}
              value={form.wifeZellePhone ?? ''}
              onChange={(v) => setForm((p) => (p ? { ...p, wifeZellePhone: v || null } : p))}
            />
          </label>
        </div>
      </div>

      <div className={cardShell}>
        <p className={sectionKicker}>Mailing</p>
        <p className={sectionTitle}>Address</p>
        <label className="mt-4 block">
          <span className={fieldLabel}>Address line 1</span>
          <input
            className={pillInput}
            value={form.addressLine1 ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, addressLine1: e.target.value } : p))}
          />
        </label>
        <label className="mt-3 block min-w-0">
          <span className={fieldLabel}>City</span>
          <input
            className={pillInput}
            value={form.city ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, city: e.target.value } : p))}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className={fieldLabel}>State</span>
            <input
              className={pillInput}
              value={form.stateRegion ?? ''}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, stateRegion: e.target.value } : p))
              }
            />
          </label>
          <label className="block min-w-0">
            <span className={fieldLabel}>ZIP</span>
            <input
              className={pillInput}
              value={form.postalCode ?? ''}
              onChange={(e) =>
                setForm((p) =>
                  p ? { ...p, postalCode: e.target.value.replace(/\D/g, '').slice(0, 10) } : p
                )
              }
            />
          </label>
        </div>
      </div>

      <div className={cardShell}>
        <p className={sectionKicker}>Save</p>
        <p className={sectionTitle}>Verify &amp; submit</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs leading-snug text-slate-600">
            Security verification is required before saving profile changes.
          </span>
          <input
            className={`${pillInput} !mt-0 w-[9.5rem] shrink-0 sm:w-40`}
            placeholder="Enter 6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button
            type="button"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => void sendCode()}
          >
            Send code
          </button>
        </div>
        {devCode && (
          <p className="mt-2 text-xs text-slate-500">
            Dev / echo code (only when server allows): {devCode}
          </p>
        )}
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
        <button className={`${primaryBtn} mt-4`} type="submit">
          Save profile changes
        </button>
      </div>
    </form>
  )
}

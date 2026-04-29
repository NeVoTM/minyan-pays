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

type Profile = {
  firstName: string
  lastName: string
  phone: string
  hasPin: boolean
  zellePhone: string | null
  wifeZellePhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
}

export function MemberProfile() {
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)
  const [form, setForm] = useState<Profile | null>(null)
  const [newPin, setNewPin] = useState('')
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
    setMsg(null)
    try {
      await api('/api/me/profile', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          zellePhone: form.zellePhone || null,
          wifeZellePhone: form.wifeZellePhone || null,
          addressLine1: form.addressLine1 || null,
          addressLine2: form.addressLine2 || null,
          city: form.city || null,
          stateRegion: form.stateRegion || null,
          postalCode: form.postalCode || null,
          pin: newPin || undefined,
          verificationCode: code,
        }),
      })
      setMsg('Profile updated.')
      setNewPin('')
      setCode('')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/member/app" />
        <div>
          <h1 className={pageTitle}>Member profile</h1>
          <p className={pageSubtitle}>View and update PIN, address, and Zelle details.</p>
        </div>
      </div>
      <form className={`${cardShell} space-y-4`} onSubmit={save}>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className={fieldLabel}>First name</span>
            <input className={pillInput} value={form.firstName} readOnly />
          </label>
          <label>
            <span className={fieldLabel}>Last name</span>
            <input className={pillInput} value={form.lastName} readOnly />
          </label>
        </div>
        <label className="block">
          <span className={fieldLabel}>Phone</span>
          <input className={pillInput} value={form.phone} readOnly />
        </label>
        <label className="block">
          <span className={fieldLabel}>New PIN (optional)</span>
          <input
            className={pinInput}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder={form.hasPin ? 'Set new PIN' : 'Set PIN'}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Zelle (you)</span>
          <PhoneInput
            className={pillInput}
            value={form.zellePhone ?? ''}
            onChange={(v) => setForm((p) => (p ? { ...p, zellePhone: v || null } : p))}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Zelle (spouse)</span>
          <PhoneInput
            className={pillInput}
            value={form.wifeZellePhone ?? ''}
            onChange={(v) => setForm((p) => (p ? { ...p, wifeZellePhone: v || null } : p))}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Address line 1</span>
          <input
            className={pillInput}
            value={form.addressLine1 ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, addressLine1: e.target.value } : p))}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Address line 2</span>
          <input
            className={pillInput}
            value={form.addressLine2 ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, addressLine2: e.target.value } : p))}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label>
            <span className={fieldLabel}>City</span>
            <input
              className={pillInput}
              value={form.city ?? ''}
              onChange={(e) => setForm((p) => (p ? { ...p, city: e.target.value } : p))}
            />
          </label>
          <label>
            <span className={fieldLabel}>State</span>
            <input
              className={pillInput}
              value={form.stateRegion ?? ''}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, stateRegion: e.target.value } : p))
              }
            />
          </label>
          <label>
            <span className={fieldLabel}>ZIP</span>
            <input
              className={pillInput}
              value={form.postalCode ?? ''}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, postalCode: e.target.value.replace(/\D/g, '').slice(0, 10) } : p))
              }
            />
          </label>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            Security verification is required before saving profile changes.
          </p>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <input
              className={pillInput}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
              onClick={() => void sendCode()}
            >
              Send code
            </button>
          </div>
          {devCode && (
            <p className="mt-2 text-xs text-slate-500">Dev code: {devCode}</p>
          )}
        </div>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
        <button className={primaryBtn} type="submit">
          Save profile changes
        </button>
      </form>
    </div>
  )
}

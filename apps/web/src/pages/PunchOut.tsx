import { useState } from 'react'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { PhoneInput } from '../components/PhoneInput'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

export function PunchOut() {
  const [phoneDigits, setPhoneDigits] = useState('')
  const [fullName, setFullName] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const nameTokens = fullName
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
  const nameOk = nameTokens.length >= 2
  const canSubmit = phoneDigits.length === 10 || nameOk

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setMsg(null)
    try {
      const body: { phone?: string; fullName?: string } = {}
      if (phoneDigits.length === 10) body.phone = phoneDigits
      if (nameOk) body.fullName = fullName.trim().replace(/\s+/g, ' ')

      const r = await api<{
        displayName: string
        punchOutAt: string
      }>('/api/punch/out-public', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const when = new Date(r.punchOutAt).toLocaleString()
      setMsg(`Punched out ${r.displayName} from minyan at ${when}.`)
      setPhoneDigits('')
      setFullName('')
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>Punch out</h1>
          <p className={pageSubtitle}>
            After the rabbi confirmed your punch-in, record when you leave — phone
            or full name.
          </p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Mobile phone</span>
            <PhoneInput className={pillInput} value={phoneDigits} onChange={setPhoneDigits} />
          </label>
          <p className="text-center text-xs font-medium text-slate-400">or</p>
          <label className="block">
            <span className={fieldLabel}>Full name</span>
            <input
              className={pillInput}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="First Last"
            />
          </label>
          {!canSubmit && (
            <p className="text-xs text-slate-500">
              Enter a 10-digit phone, or type first and last name as two words.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={primaryBtn}
          >
            {loading ? 'Saving…' : 'Record punch out'}
          </button>
        </form>
        {msg && (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-100">
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}

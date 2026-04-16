import { useState } from 'react'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

export function PunchIn() {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const r = await api<{
        attendanceId: string
        displayName: string
        punchInAt: string
        punchInStatus: string
      }>('/api/punch/in', {
        method: 'POST',
        body: JSON.stringify({ attendanceCode: code.trim() }),
      })
      setMsg(
        `Recorded for ${r.displayName}. Status: ${r.punchInStatus}. Wait for rabbi confirmation.`
      )
      setCode('')
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
          <h1 className={pageTitle}>Punch in</h1>
          <p className={pageSubtitle}>Enter your attendance code when you arrive.</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Attendance code</span>
            <input
              className={`${pillInput} font-mono tracking-widest`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              placeholder="••••••"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className={primaryBtn}
          >
            {loading ? 'Sending…' : 'Mark arrived'}
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

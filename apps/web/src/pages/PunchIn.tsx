import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

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
        name: string
        punchInAt: string
        punchInStatus: string
      }>('/api/punch/in', {
        method: 'POST',
        body: JSON.stringify({ attendanceCode: code.trim() }),
      })
      setMsg(
        `Recorded for ${r.name}. Status: ${r.punchInStatus}. Wait for rabbi confirmation.`
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
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold">Punch in</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-slate-400">
          Your attendance code
          <input
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-lg tracking-wide"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            placeholder="••••••"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-lg bg-amber-600 py-3 font-medium text-slate-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Mark arrived'}
        </button>
      </form>
      {msg && (
        <p className="rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm">
          {msg}
        </p>
      )}
    </div>
  )
}

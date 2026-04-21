import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { PhoneInput } from './PhoneInput'
import {
  fieldLabel,
  pillInput,
  pinInput,
  primaryBtn,
  punchOutDepartureBtn,
} from '../lib/uiClasses'

type Mode = 'in' | 'out'

type PunchInResp = {
  attendanceId: string
  displayName: string
  punchInAt: string
  punchInStatus: string
}

type PunchOutResp = {
  displayName: string
  punchOutAt: string
}

type Props = {
  mode: Mode
}

export function PunchIdentityForm({ mode }: Props) {
  const { t } = useTranslation()
  const readerId = useRef(`punch-qr-${Math.random().toString(36).slice(2, 11)}`)
  const readerContainerId = readerId.current
  const [code, setCode] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [pin, setPin] = useState('')
  const [smartCode, setSmartCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  const clearOther = useCallback(
    (keep: 'code' | 'phone' | 'smart') => {
      if (keep !== 'code') setCode('')
      if (keep !== 'phone') {
        setPhoneDigits('')
        setPin('')
      }
      if (keep !== 'smart') setSmartCode('')
    },
    []
  )

  const canSubmit = (() => {
    const s = smartCode.trim()
    const c = code.trim()
    if (s.length > 0) return true
    if (phoneDigits.length === 10 && pin.length >= 4) return true
    if (c.length >= 4) return true
    return false
  })()

  useEffect(() => {
    if (!scanning) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const h = new Html5Qrcode(readerContainerId)
        scannerRef.current = h
        await h.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return
            const t = decoded.trim()
            setSmartCode(t)
            setCode('')
            setPhoneDigits('')
            setPin('')
            void h.stop().then(() => {
              scannerRef.current = null
              setScanning(false)
            })
          },
          () => {}
        )
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : t('punchCommon.scanFailed'))
          setScanning(false)
        }
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
      void scannerRef.current?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [scanning, readerContainerId, t])

  async function stopScan() {
    try {
      await scannerRef.current?.stop()
    } catch {
      /* ignore */
    }
    scannerRef.current = null
    setScanning(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    const s = smartCode.trim()
    const c = code.trim()
    const modes = [
      s.length > 0,
      phoneDigits.length === 10 && pin.length >= 4,
      c.length >= 4,
    ].filter(Boolean).length
    if (modes !== 1) {
      setErr(t('punchCommon.oneMode'))
      return
    }
    let body: Record<string, string>
    if (s.length > 0) body = { smartCode: s }
    else if (phoneDigits.length === 10 && pin.length >= 4)
      body = { phone: phoneDigits, pin }
    else body = { attendanceCode: c }

    setLoading(true)
    try {
      const path = mode === 'in' ? '/api/punch/in' : '/api/punch/out-public'
      if (mode === 'in') {
        const r = await api<PunchInResp>(path, {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setMsg(
          t('punchIn.success', {
            name: r.displayName,
            status: r.punchInStatus,
          })
        )
      } else {
        const r = await api<PunchOutResp>(path, {
          method: 'POST',
          body: JSON.stringify(body),
        })
        const when = new Date(r.punchOutAt).toLocaleString()
        setMsg(t('punchOut.success', { name: r.displayName, when }))
      }
      setCode('')
      setPhoneDigits('')
      setPin('')
      setSmartCode('')
    } catch (e: unknown) {
      setMsg(null)
      setErr(e instanceof Error ? e.message : t('punchOut.error'))
    } finally {
      setLoading(false)
    }
  }

  const btnClass = mode === 'in' ? primaryBtn : punchOutDepartureBtn
  const submitKey = mode === 'in' ? 'punchIn.submit' : 'punchOut.submit'
  const loadingKey = mode === 'in' ? 'punchIn.sending' : 'punchOut.saving'

  return (
    <div className="space-y-4">
      <form onSubmit={submit} autoComplete="off" className="space-y-5">
        <input
          type="text"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        <input
          type="password"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        <div className="space-y-3">
          <label className="block">
            <span className={fieldLabel}>{t('punchIn.code')}</span>
            <input
              className={`${pillInput} font-mono tracking-widest`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (e.target.value.trim()) clearOther('code')
              }}
              autoComplete="off"
              inputMode="text"
              placeholder="••••••"
            />
          </label>
          <p className="text-center text-xs font-medium text-slate-400">
            {t('common.or')}
          </p>
          <label className="block">
            <span className={fieldLabel}>{t('punchCommon.phonePinTitle')}</span>
            <PhoneInput
              className={pillInput}
              value={phoneDigits}
              onChange={(d) => {
                setPhoneDigits(d)
                if (d.length > 0 || pin.length > 0) clearOther('phone')
              }}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>{t('memberLogin.pin')}</span>
            <input
              type="text"
              inputMode="numeric"
              className={pinInput}
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 12)
                setPin(v)
                if (v.length > 0 || phoneDigits.length > 0) clearOther('phone')
              }}
              autoComplete="off"
              minLength={4}
            />
          </label>
          <p className="text-center text-xs font-medium text-slate-400">
            {t('common.or')}
          </p>
          <label className="block">
            <span className={fieldLabel}>{t('punchCommon.smartCodeLabel')}</span>
            <textarea
              className={`${pillInput} min-h-[4.5rem] resize-y font-mono text-xs`}
              value={smartCode}
              onChange={(e) => {
                setSmartCode(e.target.value)
                if (e.target.value.trim()) clearOther('smart')
              }}
              autoComplete="off"
              placeholder={t('punchCommon.smartCodePh')}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {!scanning ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => {
                  setErr(null)
                  setScanning(true)
                }}
              >
                {t('punchCommon.scanQr')}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => void stopScan()}
              >
                {t('punchCommon.stopScan')}
              </button>
            )}
          </div>
          {scanning && (
            <div
              id={readerContainerId}
              className="min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-black/5"
            />
          )}
        </div>

        {err && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </p>
        )}

        <button type="submit" disabled={loading || !canSubmit} className={btnClass}>
          {loading ? t(loadingKey) : t(submitKey)}
        </button>
      </form>
      {!canSubmit && (
        <p className="text-xs text-slate-500">{t('punchCommon.needOne')}</p>
      )}
      {msg && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-100">
          {msg}
        </p>
      )}
    </div>
  )
}

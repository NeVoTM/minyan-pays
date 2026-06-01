import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

type ResetStep = 'request' | 'confirm'

export function AdminResetPassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [step, setStep] = useState<ResetStep>('request')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [notifyEmail, setNotifyEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function sendResetCode() {
    setErr(null)
    setMsg(null)
    setBusy(true)
    try {
      const r = await api<{
        requestId: string
        email: string
        emailDelivered: boolean
        emailError: string | null
        devCode?: string
      }>('/api/auth/admin/request-password-reset', { method: 'POST' })
      setRequestId(r.requestId)
      setNotifyEmail(r.email)
      setStep('confirm')
      const lines: string[] = [t('adminResetPassword.codeSent', { email: r.email })]
      if (r.devCode) {
        lines.push(t('adminResetPassword.devCode', { code: r.devCode }))
      } else if (!r.emailDelivered) {
        lines.push(
          t('adminResetPassword.emailFailed', { error: r.emailError ?? '' }),
        )
      }
      setMsg(lines.join(' '))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('adminResetPassword.requestFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!requestId) {
      setErr(t('adminResetPassword.noRequest'))
      return
    }
    if (!code.trim()) {
      setErr(t('adminResetPassword.codeRequired'))
      return
    }
    if (newPassword !== confirm) {
      setErr(t('adminResetPassword.mismatch'))
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/admin/confirm-password-reset', {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          code: code.trim(),
          newPassword: newPassword.trim(),
        }),
      })
      setMsg(t('adminResetPassword.done'))
      setTimeout(() => nav('/admin', { replace: true }), 1500)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('adminResetPassword.confirmFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/admin" />
        <div>
          <h1 className={pageTitle}>{t('adminResetPassword.title')}</h1>
          <p className={pageSubtitle}>{t('adminResetPassword.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        {step === 'request' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {t('adminResetPassword.requestHelp')}
            </p>
            <button
              type="button"
              className={primaryBtn}
              disabled={busy}
              onClick={() => void sendResetCode()}
            >
              {t('adminResetPassword.sendCode')}
            </button>
          </div>
        ) : (
          <form onSubmit={submitReset} className="space-y-4" autoComplete="off">
            {notifyEmail && (
              <p className="text-sm text-slate-600">
                {t('adminResetPassword.confirmHelp', { email: notifyEmail })}
              </p>
            )}
            <label className="block">
              <span className={fieldLabel}>{t('adminResetPassword.codeLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={`${pillInput} min-h-[48px] text-base tracking-widest`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                pattern="\d{6}"
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{t('adminResetPassword.newPassword')}</span>
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                className={`${pillInput} min-h-[48px] text-base`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{t('adminResetPassword.confirm')}</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                className={`${pillInput} min-h-[48px] text-base`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <p className="text-xs text-slate-500">{t('adminResetPassword.rule')}</p>
            <button type="submit" className={primaryBtn} disabled={busy}>
              {t('adminResetPassword.submit')}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
              disabled={busy}
              onClick={() => void sendResetCode()}
            >
              {t('adminResetPassword.resendCode')}
            </button>
          </form>
        )}

        {msg && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </p>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        <Link to="/admin" className="font-medium text-blue-600 hover:text-blue-700">
          {t('adminResetPassword.backLogin')}
        </Link>
      </p>
    </div>
  )
}

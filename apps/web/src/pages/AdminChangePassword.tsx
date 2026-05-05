import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const KEY = 'minyan_admin_token'

export function AdminChangePassword() {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()
  const token = localStorage.getItem(KEY)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!token) {
      setErr(t('adminChangePassword.noSession'))
      return
    }
    if (newPassword.length < 8) {
      setErr(t('adminChangePassword.tooShort'))
      return
    }
    if (newPassword !== confirm) {
      setErr(t('adminChangePassword.mismatch'))
      return
    }
    try {
      const r = await api<{ token: string }>('/api/admin/account/password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
        token,
      })
      localStorage.setItem(KEY, r.token)
      nav('/admin/app', { replace: true })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('adminChangePassword.failed'))
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{t('adminChangePassword.noSession')}</p>
        <button
          type="button"
          className={primaryBtn}
          onClick={() => nav('/admin')}
        >
          {t('adminChangePassword.backLogin')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/admin" />
        <div>
          <h1 className={pageTitle}>{t('adminChangePassword.title')}</h1>
          <p className={pageSubtitle}>{t('adminChangePassword.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          <label className="block">
            <span className={fieldLabel}>{t('adminChangePassword.newPassword')}</span>
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
            <span className={fieldLabel}>{t('adminChangePassword.confirm')}</span>
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
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button type="submit" className={primaryBtn}>
            {t('adminChangePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

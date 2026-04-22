import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { useOrg } from '../context/OrgContext'
import {
  cardShell,
  fieldLabel,
  pageTitle,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

const KEY = 'minyan_admin_token'

export function AdminLogin() {
  const { t } = useTranslation()
  const { organizationSlug } = useOrg()
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!organizationSlug) {
      setErr('Choose a location first.')
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ password, organizationSlug }),
      })
      localStorage.setItem(KEY, r.token)
      nav('/admin/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('adminLogin.title')}</h1>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>{t('adminLogin.password')}</span>
            <input
              type="password"
              className={pillInput}
              placeholder={t('adminLogin.passwordPh')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button type="submit" className={primaryBtn}>
            {t('adminLogin.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

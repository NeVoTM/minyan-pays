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
  const { organizations, organizationSlug, setOrganizationSlug } = useOrg()
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!password.trim()) {
      setErr(t('adminLogin.passwordRequired'))
      return
    }
    try {
      const r = await api<{
        token: string
        organizationSlug: string
        mustChangePassword?: boolean
      }>('/api/auth/admin', {
        method: 'POST',
        body: JSON.stringify({
          ...(organizationSlug ? { organizationSlug } : {}),
          password: password.trim(),
        }),
      })
      setOrganizationSlug(r.organizationSlug)
      localStorage.setItem(KEY, r.token)
      if (r.mustChangePassword) {
        nav('/admin/change-password', { replace: true })
      } else {
        nav('/admin/app')
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('adminLogin.loginFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/punch" />
        <div>
          <h1 className={pageTitle}>{t('adminLogin.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('adminLogin.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          <label className="block">
            <span className={fieldLabel}>{t('adminLogin.password')}</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className={pillInput}
              placeholder={t('adminLogin.passwordPh')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={1}
            />
          </label>
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={organizations.length === 0}
            className={primaryBtn}
          >
            {t('adminLogin.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

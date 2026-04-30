import { useEffect, useState } from 'react'
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
  const { organizationSlug, organizations, setOrganizationSlug } = useOrg()
  const [locationSlug, setLocationSlug] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  useEffect(() => {
    if (organizations.length === 0) return
    const next =
      locationSlug && organizations.some((o) => o.slug === locationSlug)
        ? locationSlug
        : organizationSlug &&
            organizations.some((o) => o.slug === organizationSlug)
          ? organizationSlug
          : organizations[0]!.slug
    if (locationSlug !== next) setLocationSlug(next)
    if (organizationSlug !== next) setOrganizationSlug(next)
  }, [organizations, organizationSlug, locationSlug, setOrganizationSlug])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const slug = locationSlug.trim()
    if (!slug) {
      setErr(t('adminLogin.chooseOrgFirst'))
      return
    }
    const pwd = password.trim()
    if (!pwd) {
      setErr(t('adminLogin.passwordRequired'))
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ password: pwd, organizationSlug: slug }),
      })
      setOrganizationSlug(slug)
      localStorage.setItem(KEY, r.token)
      nav('/admin/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('adminLogin.loginFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('adminLogin.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('adminLogin.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>{t('adminLogin.locationLabel')}</span>
            <select
              className={pillInput}
              value={locationSlug}
              onChange={(e) => {
                const v = e.target.value
                setLocationSlug(v)
                setOrganizationSlug(v || null)
              }}
              required
            >
              {organizations.length === 0 ? (
                <option value="">{t('common.loading')}</option>
              ) : (
                organizations.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.synagogueName}
                    {o.locationAddress ? ` — ${o.locationAddress}` : ''}
                  </option>
                ))
              )}
            </select>
            <span className="mt-1 block text-[11px] text-slate-500">
              {t('adminLogin.locationHelp')}
            </span>
          </label>
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

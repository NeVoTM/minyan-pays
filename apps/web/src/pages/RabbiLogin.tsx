import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { useOrg } from '../context/OrgContext'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  primaryBtn,
} from '../lib/uiClasses'

export const RABBI_KEY = 'minyan_rabbi_token'

export function RabbiLogin() {
  const { t } = useTranslation()
  const { organizationSlug, organizations, setOrganizationSlug } = useOrg()
  const [locationSlug, setLocationSlug] = useState('')
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
  }, [
    organizations,
    organizationSlug,
    locationSlug,
    setOrganizationSlug,
  ])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const slug = locationSlug.trim()
    if (!slug) {
      setErr(t('rabbiLogin.chooseOrgFirst'))
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/rabbi', {
        method: 'POST',
        body: JSON.stringify({ organizationSlug: slug }),
      })
      setOrganizationSlug(slug)
      localStorage.setItem(RABBI_KEY, r.token)
      nav('/rabbi/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('rabbiLogin.loginFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('rabbiLogin.title')}</h1>
          <p className={pageSubtitle}>{t('rabbiLogin.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>{t('rabbiLogin.locationLabel')}</span>
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
              {t('rabbiLogin.locationHelp')}
            </span>
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
            {t('rabbiLogin.submit')}
          </button>
        </form>
        <p className="mt-4 border-t border-slate-100 pt-3 text-center">
          <Link
            to="/admin"
            className="text-[11px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
          >
            {t('home.staffAdmin')}
          </Link>
        </p>
      </div>
    </div>
  )
}

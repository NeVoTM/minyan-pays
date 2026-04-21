import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const { organizationSlug } = useOrg()
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!organizationSlug) {
      setErr(t('rabbiLogin.chooseOrgFirst'))
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/rabbi', {
        method: 'POST',
        body: JSON.stringify({ password, organizationSlug }),
      })
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
            <span className={fieldLabel}>{t('rabbiLogin.password')}</span>
            <input
              type="password"
              className={pillInput}
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
            {t('rabbiLogin.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

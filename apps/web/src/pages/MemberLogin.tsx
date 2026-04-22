import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { PhoneInput } from '../components/PhoneInput'
import { useOrg } from '../context/OrgContext'
import {
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  pinInput,
  primaryBtn,
  cardShell,
} from '../lib/uiClasses'

const KEY = 'minyan_member_token'

export function MemberLogin() {
  const { t } = useTranslation()
  const { organizationSlug } = useOrg()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!organizationSlug) {
      setErr('Choose a location first.')
      return
    }
    if (phoneDigits.length !== 10) {
      setErr('Enter a valid 10-digit phone number.')
      return
    }
    try {
      const r = await api<{ token: string }>('/api/auth/member', {
        method: 'POST',
        body: JSON.stringify({
          phone: phoneDigits,
          pin,
          organizationSlug,
        }),
      })
      localStorage.setItem(KEY, r.token)
      nav('/member/app')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('memberLogin.title')}</h1>
          <p className={pageSubtitle}>{t('memberLogin.subtitle')}</p>
        </div>
      </div>

      <div className={cardShell}>
        <form onSubmit={submit} autoComplete="off" className="space-y-4">
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
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={fieldLabel}>{t('memberLogin.phone')}</span>
              <PhoneInput
                className={pillInput}
                value={phoneDigits}
                onChange={setPhoneDigits}
                required
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
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 12))
                }
                required
                minLength={4}
                autoComplete="off"
              />
            </label>
          </div>
          {err && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {err}
            </p>
          )}
          <button type="submit" className={primaryBtn}>
            {t('memberLogin.submit')}
          </button>
        </form>
      </div>

    </div>
  )
}

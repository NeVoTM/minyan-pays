import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { BackLink } from '../components/BackLink'
import { useOrg } from '../context/OrgContext'
import { PhoneInput } from '../components/PhoneInput'
import { formatPhoneDigits } from '../lib/phoneDisplay'
import {
  cardShell,
  fieldLabel,
  pageSubtitle,
  pageTitle,
  pillInput,
  pillTextarea,
  pinInput,
  primaryBtn,
} from '../lib/uiClasses'

const empty = () => ({
  firstName: '',
  lastName: '',
  phoneDigits: '',
  pin: '',
  attendanceCode: '',
  email: '',
  isMarried: false,
  zelleDigits: '',
  wifeZelleDigits: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
})

function scrollFieldIntoView(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (t?.scrollIntoView) {
    t.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

export function MemberSignup() {
  const { t } = useTranslation()
  const { organizationSlug, organizations } = useOrg()
  const selectedOrgName =
    organizations.find((o) => o.slug === organizationSlug)?.synagogueName ?? ''
  const [f, setF] = useState(() => empty())
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [zipErr, setZipErr] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  function applyPhoneDefaults() {
    if (f.phoneDigits.length !== 10) return
    setF((x) => ({
      ...x,
      zelleDigits: x.zelleDigits ? x.zelleDigits : x.phoneDigits,
      wifeZelleDigits: x.wifeZelleDigits ? x.wifeZelleDigits : x.phoneDigits,
    }))
  }

  async function lookupZip() {
    setZipErr(null)
    const zip = f.postalCode.replace(/\D/g, '').slice(0, 5)
    if (zip.length !== 5) return
    setZipLoading(true)
    try {
      const r = await api<{ city: string; state: string }>(
        `/api/public/zip/${zip}`
      )
      setF((x) => ({
        ...x,
        city: r.city,
        stateRegion: r.state,
      }))
    } catch (e: unknown) {
      setZipErr(e instanceof Error ? e.message : t('signup.zipFailed'))
    } finally {
      setZipLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!agreeTerms) {
      setErr(t('signup.agreeTerms'))
      return
    }
    if (!f.firstName.trim() || !f.lastName.trim()) {
      setErr(t('signup.nameRequired'))
      return
    }
    if (f.phoneDigits.length !== 10) {
      setErr(t('signup.phoneInvalid'))
      return
    }
    if (f.pin.length < 4) {
      setErr(t('signup.pinTooShort'))
      return
    }
    const zip5 = f.postalCode.replace(/\D/g, '').slice(0, 5)
    if (
      !f.addressLine1.trim() ||
      !f.city.trim() ||
      !f.stateRegion.trim() ||
      zip5.length !== 5
    ) {
      setErr(t('signup.addressRequired'))
      return
    }
    const ac = f.attendanceCode.trim()
    if (ac.length > 0 && ac.length < 4) {
      setErr(t('signup.codeRule'))
      return
    }
    if (!organizationSlug) {
      setErr(t('signup.chooseOrgFirst'))
      return
    }
    setLoading(true)
    try {
      const r = await api<{
        message: string
        displayName: string
        attendanceCode: string
      }>('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug,
          firstName: f.firstName.trim(),
          lastName: f.lastName.trim(),
          phone: f.phoneDigits,
          pin: f.pin,
          ...(f.attendanceCode.trim().length >= 4
            ? { attendanceCode: f.attendanceCode.trim() }
            : {}),
          isMarried: f.isMarried,
          email: f.email.trim() || undefined,
          zellePhone: f.zelleDigits || undefined,
          wifeZellePhone: f.wifeZelleDigits || undefined,
          addressLine1: f.addressLine1.trim(),
          addressLine2: f.addressLine2.trim() || undefined,
          city: f.city.trim(),
          stateRegion: f.stateRegion.trim(),
          postalCode: zip5,
        }),
      })
      setMsg(
        t('signup.successMsg', {
          message: r.message,
          code: r.attendanceCode,
        })
      )
      setF(empty())
      setAgreeTerms(false)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('signup.registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('signup.title')}</h1>
          <p className={pageSubtitle}>
            {t('signup.subtitle', {
              synagogueName: selectedOrgName,
            })}
          </p>
        </div>
      </div>

      {err && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {err}
        </p>
      )}
      {msg && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
          {msg}
        </p>
      )}

      <div className={cardShell}>
        <form
          onSubmit={submit}
          className="space-y-4 text-sm"
          autoComplete="off"
        >
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>{t('signup.firstName')}</span>
              <input
                className={pillInput}
                value={f.firstName}
                onChange={(e) =>
                  setF((x) => ({ ...x, firstName: e.target.value }))
                }
                onFocus={(e) => scrollFieldIntoView(e.target)}
                required
                autoComplete="off"
                placeholder={t('signup.firstName')}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{t('signup.lastName')}</span>
              <input
                className={pillInput}
                value={f.lastName}
                onChange={(e) =>
                  setF((x) => ({ ...x, lastName: e.target.value }))
                }
                onFocus={(e) => scrollFieldIntoView(e.target)}
                required
                autoComplete="off"
                placeholder={t('signup.lastName')}
              />
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>{t('signup.mobilePhone')}</span>
            <PhoneInput
              className={pillInput}
              value={f.phoneDigits}
              onChange={(d) => setF((x) => ({ ...x, phoneDigits: d }))}
              onBlur={applyPhoneDefaults}
              required
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>{t('signup.pinLabel')}</span>
            <input
              type="text"
              inputMode="numeric"
              className={pinInput}
              value={f.pin}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  pin: e.target.value.replace(/\D/g, '').slice(0, 12),
                }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              minLength={4}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>{t('signup.punchCodeOpt')}</span>
            <input
              className={pillInput}
              value={f.attendanceCode}
              onChange={(e) =>
                setF((x) => ({ ...x, attendanceCode: e.target.value }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              maxLength={32}
              autoComplete="off"
              placeholder={t('signup.punchCodePlaceholder')}
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              {t('signup.punchCodeHint')}
            </span>
          </label>

          <label className="block">
            <span className={fieldLabel}>{t('signup.emailOpt')}</span>
            <input
              type="email"
              autoComplete="email"
              className={pillInput}
              value={f.email}
              onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              placeholder="you@example.com"
            />
          </label>

          <div>
            <p className={fieldLabel}>{t('signup.addrTitle')}</p>
            <textarea
              className={pillTextarea}
              placeholder={t('signup.line1')}
              maxLength={100}
              rows={2}
              value={f.addressLine1}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  addressLine1: e.target.value.slice(0, 100),
                }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              autoComplete="street-address"
            />
            <textarea
              className={`${pillTextarea} mt-2`}
              placeholder={t('signup.line2')}
              maxLength={100}
              rows={2}
              value={f.addressLine2}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  addressLine2: e.target.value.slice(0, 100),
                }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className={pillInput}
              placeholder={t('signup.city')}
              maxLength={80}
              value={f.city}
              onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              autoComplete="address-level2"
            />
            <input
              className={pillInput}
              placeholder={t('signup.state')}
              maxLength={32}
              value={f.stateRegion}
              onChange={(e) =>
                setF((x) => ({ ...x, stateRegion: e.target.value }))
              }
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              autoComplete="address-level1"
            />
            <input
              className={pillInput}
              placeholder={t('signup.zip')}
              inputMode="numeric"
              maxLength={5}
              value={f.postalCode}
              onChange={(e) =>
                setF((x) => ({
                  ...x,
                  postalCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                }))
              }
              onBlur={() => void lookupZip()}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              autoComplete="postal-code"
            />
          </div>
          {zipLoading && (
            <p className="text-[11px] text-slate-500">{t('signup.zipLookup')}</p>
          )}
          {zipErr && (
            <p className="text-[11px] text-amber-700">{zipErr}</p>
          )}

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={f.isMarried}
              onChange={(e) =>
                setF((x) => ({ ...x, isMarried: e.target.checked }))
              }
            />
            {t('signup.married')}
          </label>

          <label className="block">
            <span className={fieldLabel}>{t('signup.zelleYou')}</span>
            <PhoneInput
              className={pillInput}
              placeholder={
                f.phoneDigits.length === 10
                  ? formatPhoneDigits(f.phoneDigits)
                  : '555-123-4567'
              }
              value={f.zelleDigits}
              onChange={(d) => setF((x) => ({ ...x, zelleDigits: d }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>{t('signup.zelleSpouse')}</span>
            <PhoneInput
              className={pillInput}
              placeholder={
                f.phoneDigits.length === 10
                  ? formatPhoneDigits(f.phoneDigits)
                  : '555-123-4567'
              }
              value={f.wifeZelleDigits}
              onChange={(d) => setF((x) => ({ ...x, wifeZelleDigits: d }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              autoComplete="off"
            />
          </label>

          <label className="flex items-start gap-3 text-sm leading-snug text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>
              {t('signup.terms')}{' '}
              <span className="font-semibold text-blue-600">
                {t('signup.termsBold')}
              </span>{' '}
              {t('signup.termsEnd')}
            </span>
          </label>

          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? t('signup.submitting') : t('signup.submit')}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        {t('signup.already')}{' '}
        <Link
          to="/member"
          className="font-semibold text-blue-600 hover:underline"
        >
          {t('signup.signIn')}
        </Link>
      </p>
    </div>
  )
}

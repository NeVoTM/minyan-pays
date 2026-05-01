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
  pageTitle,
  pillInput,
  pillTextarea,
  primaryBtn,
} from '../lib/uiClasses'

const empty = () => ({
  firstName: '',
  lastName: '',
  phoneDigits: '',
  email: '',
  isMarried: false,
  zelleDigits: '',
  wifeZelleDigits: '',
  addressLine1: '',
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
  const { organizationSlug } = useOrg()
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
    if (!organizationSlug) {
      setErr(t('signup.chooseOrgFirst'))
      return
    }
    setLoading(true)
    try {
      const r = await api<{
        message: string
        displayName: string
      }>('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug,
          firstName: f.firstName.trim(),
          lastName: f.lastName.trim(),
          phone: f.phoneDigits,
          isMarried: f.isMarried,
          email: f.email.trim() || undefined,
          zellePhone: f.zelleDigits || undefined,
          wifeZellePhone: f.wifeZelleDigits || undefined,
          addressLine1: f.addressLine1.trim(),
          city: f.city.trim(),
          stateRegion: f.stateRegion.trim(),
          postalCode: zip5,
        }),
      })
      setMsg(t('signup.successMsg', { message: r.message }))
      setF(empty())
      setAgreeTerms(false)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('signup.registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 pb-5">
      <div className="flex items-start gap-2">
        <BackLink to="/punch" />
        <div>
          <h1 className={`${pageTitle} !text-xl`}>{t('signup.title')}</h1>
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

      <div className={`${cardShell} !p-4 sm:!p-5`}>
        <form
          onSubmit={submit}
          className="grid grid-cols-2 gap-2 text-xs sm:text-sm"
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

          <label className="block">
              <span className={`${fieldLabel} !text-[11px]`}>
                {t('signup.firstName')}
              </span>
              <input
                className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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
              <span className={`${fieldLabel} !text-[11px]`}>
                {t('signup.lastName')}
              </span>
              <input
                className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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

          <label className="col-span-2 block">
            <span className={`${fieldLabel} !text-[11px]`}>
              {t('signup.mobilePhone')}
            </span>
            <PhoneInput
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
              value={f.phoneDigits}
              onChange={(d) => setF((x) => ({ ...x, phoneDigits: d }))}
              onBlur={applyPhoneDefaults}
              required
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className={`${fieldLabel} !text-[11px]`}>
              {t('signup.emailOpt')}
            </span>
            <input
              type="email"
              autoComplete="email"
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
              value={f.email}
              onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              placeholder="you@example.com"
            />
          </label>

          <div className="col-span-2">
            <p className={`${fieldLabel} !text-[11px]`}>{t('signup.addrTitle')}</p>
            <textarea
              className={`${pillTextarea} !py-2.5 !text-xs sm:!text-sm`}
              placeholder={t('signup.line1')}
              maxLength={100}
              rows={1}
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
          </div>

          <div className="col-span-2 grid gap-2 sm:grid-cols-3">
            <input
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
              placeholder={t('signup.city')}
              maxLength={80}
              value={f.city}
              onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))}
              onFocus={(e) => scrollFieldIntoView(e.target)}
              required
              autoComplete="address-level2"
            />
            <input
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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
            <p className="col-span-2 text-[10px] text-slate-500">
              {t('signup.zipLookup')}
            </p>
          )}
          {zipErr && (
            <p className="col-span-2 text-[10px] text-amber-700">{zipErr}</p>
          )}

          <label className="col-span-2 flex items-center gap-2 text-[11px] text-slate-600 sm:text-xs">
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

          <label className="col-span-2 block">
            <span className={`${fieldLabel} !text-[11px]`}>
              {t('signup.zelleYou')}
            </span>
            <PhoneInput
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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
          <label className="col-span-2 block">
            <span className={`${fieldLabel} !text-[11px]`}>
              {t('signup.zelleSpouse')}
            </span>
            <PhoneInput
              className={`${pillInput} !py-2.5 !text-xs sm:!text-sm`}
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

          <label className="col-span-2 flex items-start gap-2 text-[11px] leading-snug text-slate-600 sm:text-xs">
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

          <button
            type="submit"
            disabled={loading}
            className={`${primaryBtn} col-span-2 !py-3.5 !text-sm sm:!text-[15px]`}
          >
            {loading ? t('signup.submitting') : t('signup.submit')}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        {t('signup.already')}{' '}
        <Link
          to="/member/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          {t('signup.signIn')}
        </Link>
      </p>
    </div>
  )
}

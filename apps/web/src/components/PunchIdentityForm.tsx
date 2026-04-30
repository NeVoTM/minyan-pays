import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { PhoneInput } from './PhoneInput'
import { useOrg } from '../context/OrgContext'
import { usePunchHeader } from '../context/PunchHeaderContext'
import {
  fieldLabel,
  pillInput,
  pinInput,
  punchInCheckInBtn,
  punchOutDepartureBtn,
} from '../lib/uiClasses'

type Mode = 'in' | 'out'

type PunchInResp = {
  attendanceId: string
  displayName: string
  punchInAt: string
  punchInStatus: string
}

type PunchOutResp = {
  displayName: string
  punchOutAt: string
}

type Props = {
  mode: Mode
}

export function PunchIdentityForm({ mode }: Props) {
  const { t } = useTranslation()
  const { organizations, organizationSlug } = useOrg()
  const { setPunchInHeaderTitle } = usePunchHeader()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [pin, setPin] = useState('')
  const [locationSlug, setLocationSlug] = useState<string>('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!locationSlug) {
      setLocationSlug(
        organizationSlug ?? organizations[0]?.slug ?? ''
      )
    }
  }, [organizationSlug, organizations, locationSlug])

  useEffect(() => {
    if (mode !== 'in') return
    const org = organizations.find((o) => o.slug === locationSlug)
    setPunchInHeaderTitle(org?.synagogueName?.trim() || null)
    return () => {
      setPunchInHeaderTitle(null)
    }
  }, [mode, locationSlug, organizations, setPunchInHeaderTitle])

  useEffect(() => {
    if (mode !== 'out') return
    if (phoneDigits.length < 10 || pin.length !== 4) return
    void (async () => {
      try {
        const r = await api<{
          organizationSlug: string
          synagogueName: string
          locationAddress: string | null
        }>('/api/punch/out-location-default', {
          method: 'POST',
          body: JSON.stringify({ phone: phoneDigits, pin }),
          orgSlug: null,
        })
        setLocationSlug(r.organizationSlug)
      } catch {
        /* keep manual selection */
      }
    })()
  }, [mode, phoneDigits, pin])

  const canSubmit = (() => {
    if (phoneDigits.length >= 10 && pin.length === 4) return true
    return false
  })()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    const modes = [phoneDigits.length >= 10 && pin.length === 4].filter(Boolean).length
    if (modes !== 1) {
      setErr(t('punchCommon.needOne'))
      return
    }
    const body: Record<string, string> = {
      phone: phoneDigits,
      pin,
      organizationSlug: locationSlug,
    }

    setLoading(true)
    try {
      const path = mode === 'in' ? '/api/punch/in' : '/api/punch/out-public'
      if (mode === 'in') {
        const r = await api<PunchInResp>(path, {
          method: 'POST',
          body: JSON.stringify(body),
          orgSlug: locationSlug || null,
        })
        setMsg(
          t('punchIn.success', {
            name: r.displayName,
            status: r.punchInStatus,
          })
        )
      } else {
        const r = await api<PunchOutResp>(path, {
          method: 'POST',
          body: JSON.stringify(body),
          orgSlug: locationSlug || null,
        })
        const when = new Date(r.punchOutAt).toLocaleString()
        setPunchInHeaderTitle(null)
        setMsg(t('punchOut.success', { name: r.displayName, when }))
      }
      setPhoneDigits('')
      setPin('')
    } catch (e: unknown) {
      setMsg(null)
      setErr(e instanceof Error ? e.message : t('punchOut.error'))
    } finally {
      setLoading(false)
    }
  }

  const btnClass = mode === 'in' ? punchInCheckInBtn : punchOutDepartureBtn
  const submitKey = mode === 'in' ? 'punchIn.submit' : 'punchOut.submit'
  const loadingKey = mode === 'in' ? 'punchIn.sending' : 'punchOut.saving'

  return (
    <div className="space-y-4">
      <form onSubmit={submit} autoComplete="off" className="space-y-5">
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

        <div className="space-y-3">
          <label className="block">
            <span className={fieldLabel}>{t('punchCommon.locationLabel')}</span>
            <select
              className={pillInput}
              value={locationSlug}
              onChange={(e) => setLocationSlug(e.target.value)}
            >
              {organizations.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.synagogueName}
                  {o.locationAddress ? ` - ${o.locationAddress}` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={fieldLabel}>{t('memberLogin.phone')}</span>
            <PhoneInput
              className={pillInput}
              value={phoneDigits}
              onChange={(d) => {
                setPhoneDigits(d)
              }}
              maxDigits={15}
              formatMode="intl"
              placeholder="123-456-7890"
              autoComplete="off"
            />
            {phoneDigits.length > 10 && (
              <p className="mt-1 text-[11px] text-amber-700">
                International format: country code - territory code - city code - local tel#
              </p>
            )}
          </label>
            <label className="block">
              <span className={fieldLabel}>{t('memberLogin.pin')}</span>
            <input
              type="text"
              inputMode="numeric"
              className={pinInput}
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(v)
              }}
              autoComplete="off"
              minLength={4}
              maxLength={4}
            />
          </label>
          </div>
        </div>

        {err && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </p>
        )}

        <button type="submit" disabled={loading || !canSubmit} className={btnClass}>
          {loading ? t(loadingKey) : t(submitKey)}
        </button>
      </form>
      {msg && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-100">
          {msg}
        </p>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { PhoneInput } from './PhoneInput'
import { useOrg, type OrganizationRow } from '../context/OrgContext'
import { usePunchHeader } from '../context/PunchHeaderContext'
import {
  fieldLabel,
  pillInput,
  punchInCheckInBtn,
  punchOutDepartureBtn,
} from '../lib/uiClasses'

type Mode = 'in' | 'out'

type PunchInResp = {
  attendanceId: string
  displayName: string
  punchInAt: string
  punchInStatus: string
  organizationSlug?: string
  synagogueName?: string
}

type PunchOutResp = {
  displayName: string
  punchOutAt: string
}

type Props = {
  mode: Mode
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function nearestOrgSlug(
  lat: number,
  lng: number,
  orgs: OrganizationRow[]
): string | null {
  let best: { slug: string; d: number } | null = null
  for (const o of orgs) {
    if (o.checkInLatitude == null || o.checkInLongitude == null) continue
    const d = distanceKm(lat, lng, o.checkInLatitude, o.checkInLongitude)
    if (!best || d < best.d) best = { slug: o.slug, d }
  }
  return best?.slug ?? null
}

export function PunchIdentityForm({ mode }: Props) {
  const { t } = useTranslation()
  const { organizations, organizationSlug, setOrganizationSlug } = useOrg()
  const { setPunchInHeaderTitle } = usePunchHeader()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [pin, setPin] = useState('')
  const [locationSlug, setLocationSlug] = useState<string>('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [gpsSuggested, setGpsSuggested] = useState(false)
  const locationManualRef = useRef(false)

  useEffect(() => {
    if (!locationSlug) {
      setLocationSlug(organizationSlug ?? organizations[0]?.slug ?? '')
    }
  }, [organizationSlug, organizations, locationSlug])

  useEffect(() => {
    if (organizations.length === 0) return
    const anyCoords = organizations.some(
      (o) => o.checkInLatitude != null && o.checkInLongitude != null
    )
    if (!anyCoords || !navigator.geolocation) return
    if (locationManualRef.current) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (locationManualRef.current) return
        const slug = nearestOrgSlug(
          pos.coords.latitude,
          pos.coords.longitude,
          organizations
        )
        if (slug) {
          setLocationSlug(slug)
          setGpsSuggested(true)
        }
      },
      () => {
        /* denied or unavailable — keep dropdown default */
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 }
    )
  }, [organizations])

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
    if (phoneDigits.length < 10) return
    if (pin.trim().length < 4) return
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
        if (!locationManualRef.current) {
          setLocationSlug(r.organizationSlug)
          setGpsSuggested(false)
        }
      } catch {
        /* keep manual selection */
      }
    })()
  }, [mode, phoneDigits, pin])

  const canSubmit = phoneDigits.length >= 10 && pin.trim().length >= 4

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (phoneDigits.length < 10) {
      setErr(t('punchCommon.phoneRequired'))
      return
    }
    if (pin.trim().length < 4) {
      setErr(t('memberLogin.pinInvalid'))
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
        if (r.organizationSlug) setOrganizationSlug(r.organizationSlug)
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

        <div className="space-y-3">
          <label className="block">
            <span className={fieldLabel}>{t('punchCommon.locationLabel')}</span>
            <select
              className={pillInput}
              value={locationSlug}
              onChange={(e) => {
                locationManualRef.current = true
                setGpsSuggested(false)
                setLocationSlug(e.target.value)
              }}
            >
              {organizations.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.synagogueName}
                  {o.locationAddress ? ` - ${o.locationAddress}` : ''}
                </option>
              ))}
            </select>
          </label>
          {gpsSuggested && (
            <p className="text-[11px] text-slate-500">
              {t('punchCommon.locationSuggestedGps')}
            </p>
          )}
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
                autoComplete="new-password"
                inputName={`punch-${mode}-phone-new`}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{t('memberLogin.pin')}</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className={pillInput}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••"
                aria-label={t('memberLogin.pin')}
                autoComplete="new-password"
                name={`punch-${mode}-pin-new`}
              />
            </label>
          </div>
          <div>
            {phoneDigits.length > 10 && (
              <p className="mt-1 text-[11px] text-amber-700">
                International format: country code - territory code - city code - local tel#
              </p>
            )}
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

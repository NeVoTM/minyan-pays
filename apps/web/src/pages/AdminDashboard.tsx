import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminTokenMustChangePassword } from '../lib/adminJwt'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PhoneInput } from '../components/PhoneInput'
import { useOrg } from '../context/OrgContext'
import { phoneDigitsFromE164 } from '../lib/phoneDisplay'

const KEY = 'minyan_admin_token'

type MemberRow = {
  id: string
  firstName: string
  lastName: string
  displayName: string
  phone: string
  attendanceCode: string
  isMarried: boolean
  zellePhone: string | null
  wifeZellePhone: string | null
  bonusRecipient: string
  addressLine1: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  email: string | null
  spousePhone: string | null
  spouseEmail: string | null
  paypalAccount: string | null
  achRoutingNumber: string | null
  achAccountNumber: string | null
  isApproved: boolean
  preferredForCheckIn: boolean
  createdAt: string
}

type AdminLocationRow = {
  slug: string
  name: string
  kind: 'SYNAGOGUE' | 'STUDY_HALL'
  synagogueName: string
  locationAddress: string | null
  timezone: string
  createdAt: string
}

type RabbiProfile = {
  id: string
  name: string
  address: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  isMain: boolean
  passwordPlain: string | null
}

type TodayAttendance = {
  id: string
  punchInAt: string
  punchInStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  punchOutAt: string | null
  wouldBeFirstNine: boolean
  user: {
    id: string
    displayName: string
    phone: string
    attendanceCode: string
  }
}

type SessionResp = {
  dateKey: string
  sessionId: string
  attendances: TodayAttendance[]
}

function emptyMemberForm() {
  return {
    firstName: '',
    lastName: '',
    phoneDigits: '',
    pin: '',
    attendanceCode: '',
    isMarried: false,
    zellePhone: '',
    wifeZellePhone: '',
    addressLine1: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    email: '',
    spousePhoneDigits: '',
    spouseEmail: '',
    paypalAccount: '',
    achRoutingNumber: '',
    achAccountNumber: '',
    bonusRecipient: 'WIFE' as 'SELF' | 'WIFE',
  }
}

function rabbiOneLine(r: RabbiProfile): string {
  const addr = [r.address, r.city, r.stateRegion, r.postalCode]
    .filter(Boolean)
    .join(', ')
  const role = r.isMain ? 'MAIN' : 'rabbi'
  return [
    r.name,
    role,
    r.phone ?? '—',
    r.email ?? '—',
    addr || '—',
    r.passwordPlain ? `pw:${r.passwordPlain}` : 'no-pw',
  ].join(' · ')
}

function locationOneLine(loc: AdminLocationRow): string {
  return [
    loc.synagogueName,
    loc.slug,
    loc.locationAddress ?? '—',
    loc.timezone,
  ].join(' · ')
}

function memberOneLine(m: MemberRow, t: (k: string) => string): string {
  const cityLine = [m.city, m.stateRegion, m.postalCode]
    .filter(Boolean)
    .join(' ')
  const addr = [m.addressLine1, cityLine].filter(Boolean).join(', ')
  const status = m.isApproved ? t('admin.active') : t('admin.pending')
  const pref = m.preferredForCheckIn ? ` · ${t('admin.preferredShort')}` : ''
  return [
    m.displayName,
    m.phone,
    m.attendanceCode,
    `${status}${pref}`,
    addr,
    m.email ?? '—',
    m.zellePhone ?? '—',
    m.wifeZellePhone ?? '—',
    m.bonusRecipient,
    m.spousePhone ?? '—',
    m.paypalAccount ?? '—',
  ].join(' · ')
}

function maskBankTail(s: string | null): string {
  if (!s?.trim()) return '—'
  const t = s.trim()
  if (t.length <= 4) return '••••'
  return `••••${t.slice(-4)}`
}

/** Punch-in code must be unique per member (used at Punch in kiosk). */
function isPunchInCodeTaken(
  members: MemberRow[],
  code: string,
  excludeId?: string
): boolean {
  const c = code.trim().toLowerCase()
  if (c.length < 4) return false
  return members.some(
    (m) => m.id !== excludeId && m.attendanceCode.toLowerCase() === c
  )
}

const MODAL_BACKDROP =
  'fixed inset-0 z-50 flex items-center justify-center bg-slate-800/30 p-4 backdrop-blur-sm'
const MODAL_TEXT_BTN =
  'font-medium text-slate-700 underline decoration-slate-400 hover:text-slate-900'

export function AdminDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { refreshOrganizations } = useOrg()
  const token = localStorage.getItem(KEY)

  useEffect(() => {
    if (adminTokenMustChangePassword(token)) {
      nav('/admin/change-password', { replace: true })
    }
  }, [token, nav])

  const [members, setMembers] = useState<MemberRow[]>([])
  const [settings, setSettings] = useState<{
    slug: string
    name: string
    synagogueName?: string
    locationAddress?: string | null
    locationCity?: string | null
    locationState?: string | null
    locationPostalCode?: string | null
    locationPhone?: string | null
    locationEmail?: string | null
    locationWebsite?: string | null
    rabbiName?: string | null
    rabbiAddress?: string | null
    rabbiPhone?: string | null
    rabbiEmail?: string | null
    defaultLocale: 'en' | 'he' | 'es' | 'ru' | 'fr'
    rabbiBanner?: string | null
    firstNineCents: number
    weeklyBonusCents: number
    firstNineSlots: number
    checkInOnlyPreferred?: boolean
    checkInLatitude?: number | null
    checkInLongitude?: number | null
  } | null>(null)
  const [allLocations, setAllLocations] = useState<AdminLocationRow[]>([])
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocSlug, setNewLocSlug] = useState('')
  const [newLocName, setNewLocName] = useState('')
  const [newLocSynagogue, setNewLocSynagogue] = useState('')
  const [addLocMsg, setAddLocMsg] = useState<string | null>(null)
  const [locationNameDraft, setLocationNameDraft] = useState('')
  const [locationAddressDraft, setLocationAddressDraft] = useState('')
  const [locationCityDraft, setLocationCityDraft] = useState('')
  const [locationStateDraft, setLocationStateDraft] = useState('')
  const [locationPostalCodeDraft, setLocationPostalCodeDraft] = useState('')
  const [locationPhoneDraft, setLocationPhoneDraft] = useState('')
  const [locationEmailDraft, setLocationEmailDraft] = useState('')
  const [locationWebsiteDraft, setLocationWebsiteDraft] = useState('')
  const [locationLocaleDraft, setLocationLocaleDraft] = useState<
    'en' | 'he' | 'es' | 'ru' | 'fr'
  >('he')
  const [locationCheckInLatDraft, setLocationCheckInLatDraft] = useState('')
  const [locationCheckInLngDraft, setLocationCheckInLngDraft] = useState('')
  const [locationSetupMsg, setLocationSetupMsg] = useState<string | null>(null)
  const [rabbis, setRabbis] = useState<RabbiProfile[]>([])
  const [rabbiEditId, setRabbiEditId] = useState<string | null>(null)
  const [rabbiNameDraft, setRabbiNameDraft] = useState('')
  const [rabbiAddressDraft, setRabbiAddressDraft] = useState('')
  const [rabbiCityDraft, setRabbiCityDraft] = useState('')
  const [rabbiStateDraft, setRabbiStateDraft] = useState('')
  const [rabbiZipDraft, setRabbiZipDraft] = useState('')
  const [rabbiPhoneDraft, setRabbiPhoneDraft] = useState('')
  const [rabbiEmailDraft, setRabbiEmailDraft] = useState('')
  const [rabbiIsMainDraft, setRabbiIsMainDraft] = useState(false)
  const [rabbiPasswordDraft, setRabbiPasswordDraft] = useState('')
  const [rabbiPasswordVisible, setRabbiPasswordVisible] = useState(false)
  const [rabbiSetupMsg, setRabbiSetupMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [memberMsg, setMemberMsg] = useState<string | null>(null)
  const [viewMember, setViewMember] = useState<MemberRow | null>(null)
  const [editMember, setEditMember] = useState<MemberRow | null>(null)
  const [editForm, setEditForm] = useState(() => emptyMemberForm())
  const [editPin, setEditPin] = useState('')
  const [editSaveMsg, setEditSaveMsg] = useState<string | null>(null)
  const [adminHub, setAdminHub] = useState<
    'today' | 'member' | 'rabbi' | 'location'
  >(
    'today'
  )
  const [todaySession, setTodaySession] = useState<SessionResp | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addForm, setAddForm] = useState(() => emptyMemberForm())
  const [addPin, setAddPin] = useState('')
  const [addSaveMsg, setAddSaveMsg] = useState<string | null>(null)
  const [rabbiPanelOpen, setRabbiPanelOpen] = useState(false)
  const [locationPanelOpen, setLocationPanelOpen] = useState(false)
  const [selectedRabbiId, setSelectedRabbiId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      nav('/admin')
      return
    }
    try {
      const [st, m, rb, locs, sess] = await Promise.all([
        api<{
          slug: string
          name: string
          synagogueName?: string
          locationAddress?: string | null
          locationCity?: string | null
          locationState?: string | null
          locationPostalCode?: string | null
          locationPhone?: string | null
          locationEmail?: string | null
          locationWebsite?: string | null
          rabbiName?: string | null
          rabbiAddress?: string | null
          rabbiPhone?: string | null
          rabbiEmail?: string | null
          defaultLocale: 'en' | 'he' | 'es' | 'ru' | 'fr'
          rabbiBanner?: string | null
          firstNineCents: number
          weeklyBonusCents: number
          firstNineSlots: number
          checkInOnlyPreferred?: boolean
          checkInLatitude?: number | null
          checkInLongitude?: number | null
        }>('/api/admin/settings', { token }),
        api<MemberRow[]>('/api/admin/members', { token }),
        api<RabbiProfile[]>('/api/admin/rabbis', { token }),
        api<AdminLocationRow[]>('/api/admin/organizations', { token }),
        api<SessionResp>('/api/admin/session/today', { token }),
      ])
      setSettings(st)
      setLocationNameDraft(st.synagogueName ?? '')
      setLocationAddressDraft(st.locationAddress ?? '')
      setLocationCityDraft(st.locationCity ?? '')
      setLocationStateDraft(st.locationState ?? '')
      setLocationPostalCodeDraft(st.locationPostalCode ?? '')
      setLocationPhoneDraft(st.locationPhone ?? '')
      setLocationEmailDraft(st.locationEmail ?? '')
      setLocationWebsiteDraft(st.locationWebsite ?? '')
      setLocationLocaleDraft(st.defaultLocale ?? 'he')
      setLocationCheckInLatDraft(
        st.checkInLatitude != null ? String(st.checkInLatitude) : ''
      )
      setLocationCheckInLngDraft(
        st.checkInLongitude != null ? String(st.checkInLongitude) : ''
      )
      setRabbis(rb)
      setMembers(m)
      setAllLocations(locs)
      setTodaySession(sess)
      setErr(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (
        msg.includes('ADMIN_PASSWORD_CHANGE_REQUIRED') ||
        msg.includes('Change admin password')
      ) {
        nav('/admin/change-password', { replace: true })
        return
      }
      setErr(msg || t('admin.loadFailed'))
    }
  }, [token, nav, t])

  useEffect(() => {
    void load()
  }, [load])

  function openEdit(m: MemberRow) {
    setSelectedMemberId(m.id)
    setEditMember(m)
    setViewMember(null)
    setEditSaveMsg(null)
    setEditPin('')
    setEditForm({
      firstName: m.firstName,
      lastName: m.lastName,
      phoneDigits: phoneDigitsFromE164(m.phone),
      pin: '',
      attendanceCode: m.attendanceCode,
      isMarried: m.isMarried,
      zellePhone: m.zellePhone ?? '',
      wifeZellePhone: m.wifeZellePhone ?? '',
      addressLine1: m.addressLine1 ?? '',
      city: m.city ?? '',
      stateRegion: m.stateRegion ?? '',
      postalCode: m.postalCode ?? '',
      email: m.email ?? '',
      spousePhoneDigits: m.spousePhone
        ? phoneDigitsFromE164(m.spousePhone)
        : '',
      spouseEmail: m.spouseEmail ?? '',
      paypalAccount: m.paypalAccount ?? '',
      achRoutingNumber: m.achRoutingNumber ?? '',
      achAccountNumber: m.achAccountNumber ?? '',
      bonusRecipient: m.bonusRecipient === 'SELF' ? 'SELF' : 'WIFE',
    })
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editMember) return
    setEditSaveMsg(null)
    if (editForm.phoneDigits.length !== 10) {
      setEditSaveMsg(t('admin.phone10'))
      return
    }
    if (
      editForm.spousePhoneDigits.length > 0 &&
      editForm.spousePhoneDigits.length !== 10
    ) {
      setEditSaveMsg(t('admin.spousePhone10'))
      return
    }
    if (
      isPunchInCodeTaken(members, editForm.attendanceCode, editMember.id)
    ) {
      setEditSaveMsg(t('admin.punchTakenErr'))
      return
    }
    if (editPin.trim().length > 0 && editPin.trim().length < 4) {
      setEditSaveMsg(t('admin.pinRule'))
      return
    }
    try {
      const body: Record<string, unknown> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phoneDigits,
        attendanceCode: editForm.attendanceCode.trim(),
        isMarried: editForm.isMarried,
        isApproved: editMember.isApproved,
        zellePhone: editForm.zellePhone.trim() || null,
        wifeZellePhone: editForm.wifeZellePhone.trim() || null,
        bonusRecipient: editForm.bonusRecipient,
        addressLine1: editForm.addressLine1.trim() || null,
        city: editForm.city.trim() || null,
        stateRegion: editForm.stateRegion.trim() || null,
        postalCode: editForm.postalCode.trim() || null,
        email: editForm.email.trim() || null,
        spouseEmail: editForm.spouseEmail.trim() || null,
        paypalAccount: editForm.paypalAccount.trim() || null,
        achRoutingNumber: editForm.achRoutingNumber.trim() || null,
        achAccountNumber: editForm.achAccountNumber.trim() || null,
        spousePhone:
          editForm.spousePhoneDigits.length === 10
            ? editForm.spousePhoneDigits
            : null,
      }
      if (editPin.trim().length >= 4) body.pin = editPin.trim()
      await api(`/api/admin/members/${editMember.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      })
      setEditMember(null)
      setEditSaveMsg(null)
      setSelectedMemberId(null)
      setMemberMsg(t('admin.memberUpdated'))
      await load()
    } catch (e: unknown) {
      setEditSaveMsg(e instanceof Error ? e.message : t('admin.updateFailed'))
    }
  }

  async function approveMember(id: string) {
    if (!token) return
    setMemberMsg(null)
    try {
      await api(`/api/admin/members/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isApproved: true }),
      })
      setMemberMsg(t('admin.memberApproved'))
      await load()
    } catch (e: unknown) {
      setMemberMsg(e instanceof Error ? e.message : t('admin.approveFailed'))
    }
  }

  async function deleteMember(id: string) {
    if (!token) return
    if (
      !window.confirm(t('admin.deleteMemberConfirm'))
    ) {
      return
    }
    setEditSaveMsg(null)
    try {
      await api(`/api/admin/members/${id}`, { method: 'DELETE', token })
      setEditMember(null)
      setViewMember((v) => (v?.id === id ? null : v))
      setSelectedMemberId((s) => (s === id ? null : s))
      setMemberMsg(t('admin.memberDeleted'))
      await load()
    } catch (e: unknown) {
      setEditSaveMsg(e instanceof Error ? e.message : t('admin.deleteFailed'))
    }
  }

  async function saveAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setAddSaveMsg(null)
    if (addForm.phoneDigits.length !== 10) {
      setAddSaveMsg(t('admin.phone10'))
      return
    }
    if (
      addForm.spousePhoneDigits.length > 0 &&
      addForm.spousePhoneDigits.length !== 10
    ) {
      setAddSaveMsg(t('admin.spousePhone10'))
      return
    }
    if (isPunchInCodeTaken(members, addForm.attendanceCode)) {
      setAddSaveMsg(t('admin.punchTakenErr'))
      return
    }
    const zip5 = addForm.postalCode.replace(/\D/g, '').slice(0, 5)
    if (zip5.length !== 5) {
      setAddSaveMsg(t('admin.zip5Required'))
      return
    }
    if (addPin.trim().length < 4) {
      setAddSaveMsg(t('admin.pinRule'))
      return
    }
    if (!addForm.addressLine1.trim() || !addForm.city.trim() || !addForm.stateRegion.trim()) {
      setAddSaveMsg(t('admin.addressRequired'))
      return
    }
    try {
      await api('/api/admin/members', {
        method: 'POST',
        token,
        body: JSON.stringify({
          firstName: addForm.firstName.trim(),
          lastName: addForm.lastName.trim(),
          phone: addForm.phoneDigits,
          pin: addPin.trim(),
          attendanceCode: addForm.attendanceCode.trim(),
          isMarried: addForm.isMarried,
          bonusRecipient: addForm.bonusRecipient,
          zellePhone: addForm.zellePhone.trim() || null,
          wifeZellePhone: addForm.wifeZellePhone.trim() || null,
          addressLine1: addForm.addressLine1.trim(),
          city: addForm.city.trim(),
          stateRegion: addForm.stateRegion.trim(),
          postalCode: zip5,
          email: addForm.email.trim() || null,
          spouseEmail: addForm.spouseEmail.trim() || null,
          spousePhone:
            addForm.spousePhoneDigits.length === 10
              ? addForm.spousePhoneDigits
              : null,
          paypalAccount: addForm.paypalAccount.trim() || null,
          achRoutingNumber: addForm.achRoutingNumber.trim() || null,
          achAccountNumber: addForm.achAccountNumber.trim() || null,
        }),
      })
      setAddMemberOpen(false)
      setAddForm(emptyMemberForm())
      setAddPin('')
      setMemberMsg(t('admin.memberCreated'))
      await load()
    } catch (e: unknown) {
      setAddSaveMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  async function saveLocationSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLocationSetupMsg(null)
    const trimmedName = locationNameDraft.trim()
    if (!trimmedName) {
      setLocationSetupMsg(t('admin.locationNameRequired'))
      return
    }
    const latT = locationCheckInLatDraft.trim()
    const lngT = locationCheckInLngDraft.trim()
    let checkInLatitude: number | null | undefined
    let checkInLongitude: number | null | undefined
    if (!latT && !lngT) {
      checkInLatitude = null
      checkInLongitude = null
    } else {
      if (!latT || !lngT) {
        setLocationSetupMsg(t('admin.checkInCoordsPair'))
        return
      }
      const lat = Number(latT)
      const lng = Number(lngT)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setLocationSetupMsg(t('admin.checkInCoordsInvalid'))
        return
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setLocationSetupMsg(t('admin.checkInCoordsInvalid'))
        return
      }
      checkInLatitude = lat
      checkInLongitude = lng
    }
    const cityT = locationCityDraft.trim()
    const stateT = locationStateDraft.trim()
    const zipT = locationPostalCodeDraft.replace(/\D/g, '').slice(0, 5)
    const addressChanged =
      (settings?.locationAddress ?? '') !== locationAddressDraft.trim() ||
      (settings?.locationCity ?? '') !== cityT ||
      (settings?.locationState ?? '') !== stateT ||
      (settings?.locationPostalCode ?? '') !== zipT
    const autoGeocode = !latT && !lngT && (cityT || zipT) && addressChanged
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          synagogueName: trimmedName,
          locationAddress: locationAddressDraft.trim() || null,
          locationCity: cityT || null,
          locationState: stateT || null,
          locationPostalCode: zipT || null,
          locationPhone: locationPhoneDraft.trim() || null,
          locationEmail: locationEmailDraft.trim() || null,
          locationWebsite: locationWebsiteDraft.trim() || null,
          defaultLocale: locationLocaleDraft,
          checkInLatitude,
          checkInLongitude,
          autoGeocode: autoGeocode ? true : undefined,
        }),
      })
      setLocationPanelOpen(false)
      setLocationSetupMsg(t('admin.locationSaved'))
      await load()
    } catch (e: unknown) {
      setLocationSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  async function geocodeFromAddress() {
    if (!token) return
    setLocationSetupMsg(null)
    try {
      const params = new URLSearchParams()
      if (locationAddressDraft.trim()) params.set('address', locationAddressDraft.trim())
      if (locationCityDraft.trim()) params.set('city', locationCityDraft.trim())
      if (locationStateDraft.trim()) params.set('state', locationStateDraft.trim())
      const zip = locationPostalCodeDraft.replace(/\D/g, '').slice(0, 5)
      if (zip) params.set('postalCode', zip)
      const r = await api<{ latitude: number; longitude: number; displayName: string }>(
        `/api/admin/geocode?${params.toString()}`,
        { token }
      )
      setLocationCheckInLatDraft(String(r.latitude))
      setLocationCheckInLngDraft(String(r.longitude))
      setLocationSetupMsg(t('admin.geocodeSuccess'))
    } catch {
      setLocationSetupMsg(t('admin.geocodeFailed'))
    }
  }

  async function clearLocationSetup() {
    if (!token || !settings) return
    setLocationSetupMsg(null)
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          synagogueName: settings.name,
          locationAddress: null,
          locationCity: null,
          locationState: null,
          locationPostalCode: null,
          locationPhone: null,
          locationEmail: null,
          locationWebsite: null,
        }),
      })
      setLocationPanelOpen(false)
      setLocationSetupMsg(t('admin.locationDeleted'))
      await load()
    } catch (e: unknown) {
      setLocationSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  function resetRabbiForm() {
    setRabbiEditId(null)
    setRabbiNameDraft('')
    setRabbiAddressDraft('')
    setRabbiCityDraft('')
    setRabbiStateDraft('')
    setRabbiZipDraft('')
    setRabbiPhoneDraft('')
    setRabbiEmailDraft('')
    setRabbiIsMainDraft(false)
    setRabbiPasswordDraft('')
    setRabbiPasswordVisible(false)
  }

  function beginEditRabbi(r: RabbiProfile) {
    setRabbiEditId(r.id)
    setRabbiNameDraft(r.name ?? '')
    setRabbiAddressDraft(r.address ?? '')
    setRabbiCityDraft(r.city ?? '')
    setRabbiStateDraft(r.stateRegion ?? '')
    setRabbiZipDraft(r.postalCode ?? '')
    setRabbiPhoneDraft(r.phone ? phoneDigitsFromE164(r.phone) : '')
    setRabbiEmailDraft(r.email ?? '')
    setRabbiIsMainDraft(r.isMain === true)
    setRabbiPasswordDraft(r.passwordPlain ?? '')
    setRabbiPasswordVisible(false)
  }

  function isAlphaNum8(s: string): boolean {
    return /^[A-Za-z0-9]{8}$/.test(s)
  }

  async function generateRabbiPasswordClient() {
    if (!token) return
    try {
      const r = await api<{ password: string }>('/api/admin/passwords/generate', {
        token,
      })
      setRabbiPasswordDraft(r.password)
      setRabbiPasswordVisible(true)
    } catch {
      const ALPH =
        'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      let pw = ''
      const buf = new Uint32Array(8)
      crypto.getRandomValues(buf)
      for (let i = 0; i < 8; i += 1) pw += ALPH[buf[i]! % ALPH.length]
      setRabbiPasswordDraft(pw)
      setRabbiPasswordVisible(true)
    }
  }

  async function saveRabbiSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setRabbiSetupMsg(null)
    if (!rabbiNameDraft.trim()) {
      setRabbiSetupMsg(t('admin.rabbiNameRequired'))
      return
    }
    const pwTrim = rabbiPasswordDraft.trim()
    if (pwTrim && !isAlphaNum8(pwTrim)) {
      setRabbiSetupMsg(t('admin.rabbiPasswordRule'))
      return
    }
    try {
      const body: Record<string, unknown> = {
        name: rabbiNameDraft.trim(),
        address: rabbiAddressDraft.trim() || null,
        city: rabbiCityDraft.trim() || null,
        stateRegion: rabbiStateDraft.trim() || null,
        postalCode: rabbiZipDraft.trim() || null,
        phone: rabbiPhoneDraft.trim() || null,
        email: rabbiEmailDraft.trim() || null,
        isMain: rabbiIsMainDraft,
      }
      if (pwTrim) {
        body.password = pwTrim
      } else if (rabbiEditId) {
        body.password = null
      }
      await api(rabbiEditId ? `/api/admin/rabbis/${rabbiEditId}` : '/api/admin/rabbis', {
        method: rabbiEditId ? 'PATCH' : 'POST',
        token,
        body: JSON.stringify(body),
      })
      resetRabbiForm()
      setRabbiPanelOpen(false)
      setRabbiSetupMsg(t('admin.rabbiSetupSaved'))
      await load()
    } catch (e: unknown) {
      setRabbiSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  async function deleteRabbi(id: string) {
    if (!token) return
    if (!window.confirm(t('admin.deleteRabbiConfirm'))) return
    setRabbiSetupMsg(null)
    try {
      await api(`/api/admin/rabbis/${id}`, { method: 'DELETE', token })
      if (rabbiEditId === id) resetRabbiForm()
      setRabbiSetupMsg(t('admin.rabbiDeleted'))
      await load()
    } catch (e: unknown) {
      setRabbiSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  async function submitAddLocation(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setAddLocMsg(null)
    const slug = newLocSlug.trim()
    const name = newLocName.trim()
    const syn = newLocSynagogue.trim() || name
    if (!slug || !name) {
      setAddLocMsg(t('admin.addLocationRequired'))
      return
    }
    try {
      await api('/api/admin/organizations', {
        method: 'POST',
        token,
        body: JSON.stringify({
          slug,
          name,
          synagogueName: syn,
        }),
      })
      setAddLocMsg(t('admin.locationCreated'))
      setNewLocSlug('')
      setNewLocName('')
      setNewLocSynagogue('')
      setShowAddLocation(false)
      await refreshOrganizations()
      await load()
    } catch (e: unknown) {
      setAddLocMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  const pendingApprovalCount = members.filter((m) => !m.isApproved).length
  const punchInTakenEdit = useMemo(
    () =>
      editMember
        ? isPunchInCodeTaken(members, editForm.attendanceCode, editMember.id)
        : false,
    [members, editForm.attendanceCode, editMember]
  )
  const punchInTakenAdd = useMemo(
    () => isPunchInCodeTaken(members, addForm.attendanceCode),
    [members, addForm.attendanceCode]
  )
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  )
  const selectedRabbi = useMemo(
    () => rabbis.find((r) => r.id === selectedRabbiId) ?? null,
    [rabbis, selectedRabbiId]
  )
  const todayRows = todaySession?.attendances ?? []

  const inp =
    'mt-0.5 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-900'
  const lbl = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-600'

  if (!token) return null

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-3 pb-4 text-center sm:text-left">
      <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/punch"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-medium text-slate-700 shadow-sm sm:text-left sm:text-xs"
        >
          {t('admin.home')}
        </Link>
        <button
          type="button"
          className="w-full rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-800 sm:w-auto sm:text-xs"
          onClick={() => {
            localStorage.removeItem(KEY)
            nav('/admin')
          }}
        >
          {t('admin.logout')}
        </button>
      </div>
      <div>
        <h1 className="text-lg font-semibold leading-tight sm:text-xl">
          {t('admin.title')}
        </h1>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {memberMsg && <p className="text-xs text-slate-600">{memberMsg}</p>}

      <nav
        className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label={t('admin.navAria')}
      >
        <button
          type="button"
          className={`min-w-0 rounded-xl border-2 px-2 py-3 text-center text-[10px] font-bold leading-tight whitespace-normal ${
            adminHub === 'today'
              ? 'border-cyan-600 bg-cyan-600 text-white shadow-md'
              : 'border-cyan-200 bg-cyan-50 text-cyan-900'
          }`}
          onClick={() => {
            setAdminHub('today')
            setMemberMsg(null)
          }}
        >
          {t('admin.hubToday')}
        </button>
        <button
          type="button"
          className={`min-w-0 rounded-xl border-2 px-2 py-3 text-center text-[10px] font-bold leading-tight whitespace-normal ${
            adminHub === 'member'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
              : 'border-indigo-200 bg-indigo-50 text-indigo-900'
          }`}
          onClick={() => {
            setAdminHub('member')
            setMemberMsg(null)
          }}
        >
          {t('admin.hubMember')}
        </button>
        <button
          type="button"
          className={`min-w-0 rounded-xl border-2 px-2 py-3 text-center text-[10px] font-bold leading-tight whitespace-normal ${
            adminHub === 'rabbi'
              ? 'border-violet-600 bg-violet-600 text-white shadow-md'
              : 'border-violet-200 bg-violet-50 text-violet-900'
          }`}
          onClick={() => {
            setAdminHub('rabbi')
            setMemberMsg(null)
            setSelectedRabbiId(null)
          }}
        >
          {t('admin.hubRabbi')}
        </button>
        <button
          type="button"
          className={`min-w-0 rounded-xl border-2 px-2 py-3 text-center text-[10px] font-bold leading-tight whitespace-normal ${
            adminHub === 'location'
              ? 'border-amber-500 bg-amber-500 text-white shadow-md'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
          onClick={() => {
            setAdminHub('location')
            setMemberMsg(null)
          }}
        >
          {t('admin.hubLocation')}
        </button>
      </nav>

      {adminHub === 'today' && (
        <div className="w-full min-w-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-[11px] font-semibold text-slate-700">
              {t('admin.todayCheckIns', { count: todayRows.length })}
            </p>
            <button
              type="button"
              className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-[11px] font-semibold text-cyan-900"
              onClick={() => void load()}
            >
              {t('admin.actionRefresh')}
            </button>
          </div>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto">
            {todayRows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
              >
                <div className="overflow-x-auto whitespace-nowrap text-[10px] font-mono leading-snug text-slate-800">
                  {[
                    row.user.displayName,
                    row.user.phone,
                    row.user.attendanceCode,
                    row.punchInStatus,
                    new Date(row.punchInAt).toLocaleTimeString(),
                    row.punchOutAt
                      ? `out ${new Date(row.punchOutAt).toLocaleTimeString()}`
                      : 'out —',
                    row.wouldBeFirstNine ? 'first-9' : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            ))}
          </div>
          {todayRows.length === 0 && (
            <p className="text-center text-xs text-slate-500">
              {t('admin.noPunchInsToday')}
            </p>
          )}
        </div>
      )}

      {adminHub === 'member' && (
        <div className="w-full min-w-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white"
              onClick={() => {
                setAddSaveMsg(null)
                setAddForm(emptyMemberForm())
                setAddPin('')
                setAddMemberOpen(true)
              }}
            >
              {t('admin.actionAdd')}
            </button>
            <button
              type="button"
              disabled={!selectedMember}
              className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-900 disabled:opacity-40"
              onClick={() => selectedMember && setViewMember(selectedMember)}
            >
              {t('admin.actionView')}
            </button>
            <button
              type="button"
              disabled={!selectedMember}
              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-[11px] font-semibold text-indigo-900 disabled:opacity-40"
              onClick={() => selectedMember && openEdit(selectedMember)}
            >
              {t('admin.actionEdit')}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-500">
            {t('admin.doubleClickHint')}
          </p>
          {pendingApprovalCount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase text-amber-900">
                {t('admin.approvalsHeader', { count: pendingApprovalCount })}
              </p>
              <ul className="max-h-28 space-y-1 overflow-y-auto">
                {members
                  .filter((m) => !m.isApproved)
                  .map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-1 text-[10px]"
                    >
                      <span className="min-w-0 truncate font-medium text-slate-800">
                        {m.displayName}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 rounded bg-emerald-600 px-2 py-0.5 text-white"
                        onClick={() => void approveMember(m.id)}
                      >
                        {t('admin.approve')}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className="max-h-[55vh] space-y-1 overflow-y-auto">
            {members.map((m) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMemberId(m.id)}
                onDoubleClick={() => openEdit(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedMemberId(m.id)
                  }
                }}
                className={`cursor-pointer rounded-lg border px-2 py-1.5 text-left transition ${
                  selectedMemberId === m.id
                    ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="overflow-x-auto whitespace-nowrap text-[10px] font-mono leading-snug text-slate-800">
                  {memberOneLine(m, t)}
                </div>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <p className="text-center text-xs text-slate-500">
              {t('admin.noMembers')}
            </p>
          )}
        </div>
      )}

      {adminHub === 'rabbi' && (
        <div className="w-full min-w-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white"
              onClick={() => {
                setRabbiSetupMsg(null)
                resetRabbiForm()
                setRabbiPasswordDraft('')
                setRabbiPanelOpen(true)
              }}
            >
              {t('admin.actionAdd')}
            </button>
            <button
              type="button"
              disabled={!selectedRabbi}
              className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-900 disabled:opacity-40"
              onClick={() => {
                if (!selectedRabbi) return
                beginEditRabbi(selectedRabbi)
                setRabbiPanelOpen(true)
              }}
            >
              {t('admin.actionView')}
            </button>
            <button
              type="button"
              disabled={!selectedRabbi}
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-[11px] font-semibold text-violet-900 disabled:opacity-40"
              onClick={() => {
                if (!selectedRabbi) return
                beginEditRabbi(selectedRabbi)
                setRabbiPanelOpen(true)
              }}
            >
              {t('admin.actionEdit')}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-500">
            {t('admin.doubleClickHint')}
          </p>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto">
            {rabbis.map((r) => (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRabbiId(r.id)}
                onDoubleClick={() => {
                  beginEditRabbi(r)
                  setRabbiPanelOpen(true)
                }}
                className={`cursor-pointer rounded-lg border px-2 py-1.5 text-left ${
                  selectedRabbiId === r.id
                    ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="overflow-x-auto whitespace-nowrap text-[10px] font-mono text-slate-800">
                  {rabbiOneLine(r)}
                </div>
              </div>
            ))}
          </div>
          {rabbis.length === 0 && (
            <p className="text-center text-xs text-slate-500">
              {t('admin.noRabbisYet')}
            </p>
          )}
        </div>
      )}

      {adminHub === 'location' && (
        <div className="w-full min-w-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white"
              onClick={() => {
                setAddLocMsg(null)
                setShowAddLocation(true)
              }}
            >
              {t('admin.actionAdd')}
            </button>
            <button
              type="button"
              disabled={!settings}
              className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-900 disabled:opacity-40"
              onClick={() => {
                if (!settings) return
                setLocationSetupMsg(null)
                setLocationPanelOpen(true)
              }}
            >
              {t('admin.actionView')}
            </button>
            <button
              type="button"
              disabled={!settings}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900 disabled:opacity-40"
              onClick={() => {
                if (!settings) return
                setLocationSetupMsg(null)
                setLocationPanelOpen(true)
              }}
            >
              {t('admin.actionEdit')}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-500">
            {t('admin.locationListHint')}
          </p>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto">
            {allLocations.map((loc) => (
              <div
                key={loc.slug}
                role="button"
                tabIndex={0}
                onDoubleClick={() => {
                  if (settings && loc.slug === settings.slug) {
                    setLocationPanelOpen(true)
                  } else {
                    setMemberMsg(t('admin.switchLocationToEdit'))
                  }
                }}
                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
              >
                <div className="overflow-x-auto whitespace-nowrap text-[10px] font-mono text-slate-800">
                  {locationOneLine(loc)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locationPanelOpen && settings && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('admin.locationPanelTitle')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => setLocationPanelOpen(false)}
              >
                {t('common.close')}
              </button>
            </div>
            <form className="grid gap-2" onSubmit={saveLocationSetup}>
              <div className="grid grid-cols-2 items-start gap-2">
                <label className={lbl}>
                  {t('admin.locationDisplayName')}
                  <input
                    className={inp}
                    value={locationNameDraft}
                    onChange={(e) => setLocationNameDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('admin.phone')}
                  <PhoneInput
                    className={inp}
                    value={phoneDigitsFromE164(locationPhoneDraft)}
                    onChange={setLocationPhoneDraft}
                  />
                </label>
              </div>
              <label className={lbl}>
                {t('admin.addressStreet')}
                <input
                  className={inp}
                  value={locationAddressDraft}
                  onChange={(e) => setLocationAddressDraft(e.target.value)}
                  placeholder="100 Main St"
                />
              </label>
              <div className="grid grid-cols-3 gap-1">
                <label className={lbl}>
                  {t('admin.addressCity')}
                  <input
                    className={inp}
                    value={locationCityDraft}
                    onChange={(e) => setLocationCityDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('admin.addressState')}
                  <input
                    className={inp}
                    value={locationStateDraft}
                    onChange={(e) => setLocationStateDraft(e.target.value)}
                    maxLength={4}
                  />
                </label>
                <label className={lbl}>
                  {t('admin.addressZip')}
                  <input
                    className={inp}
                    inputMode="numeric"
                    maxLength={5}
                    value={locationPostalCodeDraft}
                    onChange={(e) =>
                      setLocationPostalCodeDraft(
                        e.target.value.replace(/\D/g, '').slice(0, 5)
                      )
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.labelEmail')}
                  <input
                    type="email"
                    className={inp}
                    value={locationEmailDraft}
                    onChange={(e) => setLocationEmailDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('admin.website')}
                  <input
                    type="url"
                    className={inp}
                    value={locationWebsiteDraft}
                    onChange={(e) => setLocationWebsiteDraft(e.target.value)}
                  />
                </label>
              </div>
              <label className={lbl}>
                {t('admin.locationDefaultLanguage')}
                <select
                  className={inp}
                  value={locationLocaleDraft}
                  onChange={(e) =>
                    setLocationLocaleDraft(
                      e.target.value as 'en' | 'he' | 'es' | 'ru' | 'fr'
                    )
                  }
                >
                  <option value="he">{t('lang.he')}</option>
                  <option value="en">{t('lang.en')}</option>
                  <option value="es">{t('lang.es')}</option>
                  <option value="ru">{t('lang.ru')}</option>
                  <option value="fr">{t('lang.fr')}</option>
                </select>
              </label>
              <p className="text-[11px] text-slate-500">{t('admin.geocodeAutoHelp')}</p>
              <button
                type="button"
                className="rounded-lg border border-sky-300 bg-sky-50 py-2 text-[11px] font-semibold text-sky-900"
                onClick={() => void geocodeFromAddress()}
              >
                {t('admin.geocodeAuto')}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.checkInLatitude')}
                  <input
                    className={inp}
                    inputMode="decimal"
                    value={locationCheckInLatDraft}
                    onChange={(e) => setLocationCheckInLatDraft(e.target.value)}
                    placeholder="25.7617"
                  />
                </label>
                <label className={lbl}>
                  {t('admin.checkInLongitude')}
                  <input
                    className={inp}
                    inputMode="decimal"
                    value={locationCheckInLngDraft}
                    onChange={(e) => setLocationCheckInLngDraft(e.target.value)}
                    placeholder="-80.1918"
                  />
                </label>
              </div>
              <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-2">
                <p className="text-[11px] font-semibold text-violet-900">
                  {t('admin.rabbisAtLocationTitle')}
                </p>
                {rabbis.length === 0 ? (
                  <p className="mt-1 text-[10px] text-slate-500">
                    {t('admin.noRabbisYet')}
                  </p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-[10px] font-mono text-slate-800">
                    {rabbis.map((r) => (
                      <li key={r.id}>
                        {r.isMain ? '★ ' : '• '}
                        {r.name}
                        {r.passwordPlain ? ` · pw:${r.passwordPlain}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white"
                >
                  {t('admin.saveLocationSetup')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-800"
                  onClick={() => void clearLocationSetup()}
                >
                  {t('common.delete')}
                </button>
              </div>
            </form>
            {locationSetupMsg && (
              <p className="mt-2 text-[11px] text-slate-600">{locationSetupMsg}</p>
            )}
          </div>
        </div>
      )}

      {rabbiPanelOpen && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {rabbiEditId ? t('admin.editRabbiTitle') : t('admin.addRabbiTitle')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => {
                  setRabbiPanelOpen(false)
                  resetRabbiForm()
                  setRabbiPasswordDraft('')
                }}
              >
                {t('common.close')}
              </button>
            </div>
            <form className="grid gap-2" onSubmit={saveRabbiSetup}>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.rabbiName')}
                  <input
                    className={inp}
                    value={rabbiNameDraft}
                    onChange={(e) => setRabbiNameDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('admin.phone')}
                  <PhoneInput
                    className={inp}
                    value={rabbiPhoneDraft}
                    onChange={setRabbiPhoneDraft}
                  />
                </label>
              </div>
              <label className={lbl}>
                {t('admin.address')}
                <input
                  className={inp}
                  value={rabbiAddressDraft}
                  onChange={(e) => setRabbiAddressDraft(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-3 gap-1">
                <label className={lbl}>
                  {t('signup.city')}
                  <input
                    className={inp}
                    value={rabbiCityDraft}
                    onChange={(e) => setRabbiCityDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('signup.state')}
                  <input
                    className={inp}
                    value={rabbiStateDraft}
                    onChange={(e) => setRabbiStateDraft(e.target.value)}
                  />
                </label>
                <label className={lbl}>
                  {t('signup.zip')}
                  <input
                    className={inp}
                    value={rabbiZipDraft}
                    onChange={(e) => setRabbiZipDraft(e.target.value)}
                  />
                </label>
              </div>
              <label className={lbl}>
                {t('admin.labelEmail')}
                <input
                  type="email"
                  className={inp}
                  value={rabbiEmailDraft}
                  onChange={(e) => setRabbiEmailDraft(e.target.value)}
                />
              </label>
              <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  checked={rabbiIsMainDraft}
                  onChange={(e) => setRabbiIsMainDraft(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    {t('admin.rabbiIsMainLabel')}
                  </span>
                  <span className="block text-[10px] text-slate-600">
                    {t('admin.rabbiIsMainHelp')}
                  </span>
                </span>
              </label>
              <div>
                <span className={lbl}>{t('admin.rabbiPasswordLabel')}</span>
                <div className="mt-0.5 flex gap-1">
                  <input
                    type={rabbiPasswordVisible ? 'text' : 'password'}
                    className={`${inp} font-mono`}
                    value={rabbiPasswordDraft}
                    onChange={(e) =>
                      setRabbiPasswordDraft(
                        e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
                      )
                    }
                    autoComplete="new-password"
                    placeholder={t('admin.rabbiPasswordPlaceholder')}
                    maxLength={8}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700"
                    onClick={() => setRabbiPasswordVisible((v) => !v)}
                  >
                    {rabbiPasswordVisible
                      ? t('admin.rabbiPasswordHide')
                      : t('admin.rabbiPasswordShow')}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-900"
                    onClick={() => void generateRabbiPasswordClient()}
                  >
                    {t('admin.rabbiPasswordGenerate')}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  {t('admin.rabbiPasswordHelp')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white"
                >
                  {rabbiEditId ? t('admin.saveRabbiSetup') : t('admin.addRabbi')}
                </button>
                {rabbiEditId && (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-800"
                    onClick={() => void deleteRabbi(rabbiEditId)}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </form>
            {rabbiSetupMsg && (
              <p className="mt-2 text-[11px] text-slate-600">{rabbiSetupMsg}</p>
            )}
          </div>
        </div>
      )}

      {addMemberOpen && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('admin.addMemberModalTitle')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => {
                  setAddMemberOpen(false)
                  setAddSaveMsg(null)
                }}
              >
                {t('common.close')}
              </button>
            </div>
            <form className="grid gap-2" onSubmit={saveAddMember}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('signup.firstName')}
                  value={addForm.firstName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
                <input
                  className={inp}
                  placeholder={t('signup.lastName')}
                  value={addForm.lastName}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>
              <label className={lbl}>
                {t('admin.phone')}
                <PhoneInput
                  className={inp}
                  value={addForm.phoneDigits}
                  onChange={(d) => setAddForm((f) => ({ ...f, phoneDigits: d }))}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.newPinPh')}
                  <input
                    type="password"
                    className={inp}
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label className={lbl}>
                  {t('admin.punchInPh')}
                  <input
                    className={`${inp} font-mono ${punchInTakenAdd ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                    value={addForm.attendanceCode}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        attendanceCode: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
              {punchInTakenAdd && (
                <p className="text-xs text-red-600">{t('admin.punchInTaken')}</p>
              )}
              <label className={lbl}>
                {t('admin.street1')}
                <input
                  className={inp}
                  value={addForm.addressLine1}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, addressLine1: e.target.value }))
                  }
                  required
                />
              </label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  className={inp}
                  placeholder={t('signup.city')}
                  value={addForm.city}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, city: e.target.value }))
                  }
                  required
                />
                <input
                  className={inp}
                  placeholder={t('signup.state')}
                  value={addForm.stateRegion}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, stateRegion: e.target.value }))
                  }
                  required
                />
                <input
                  className={inp}
                  placeholder={t('signup.zip')}
                  value={addForm.postalCode}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      postalCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={5}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={addForm.isMarried}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, isMarried: e.target.checked }))
                    }
                  />
                  {t('admin.marriedLabel')}
                </label>
                <label className={lbl}>
                  {t('admin.bonusRecipientLabel')}
                  <select
                    className={inp}
                    value={addForm.bonusRecipient}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        bonusRecipient: e.target.value as 'SELF' | 'WIFE',
                      }))
                    }
                  >
                    <option value="WIFE">{t('billing.toSpouseZelle')}</option>
                    <option value="SELF">{t('billing.toYourZelle')}</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('admin.zellePlaceholder')}
                  value={addForm.zellePhone}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, zellePhone: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('admin.spouseZellePlaceholder')}
                  value={addForm.wifeZellePhone}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, wifeZellePhone: e.target.value }))
                  }
                />
              </div>
              <input
                className={inp}
                type="email"
                placeholder={t('signup.emailOpt')}
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.spousePhone')}
                  <PhoneInput
                    className={inp}
                    value={addForm.spousePhoneDigits}
                    onChange={(d) =>
                      setAddForm((f) => ({ ...f, spousePhoneDigits: d }))
                    }
                  />
                </label>
                <input
                  className={inp}
                  type="email"
                  placeholder={t('admin.spouseEmail')}
                  value={addForm.spouseEmail}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, spouseEmail: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('admin.paypalPh')}
                  value={addForm.paypalAccount}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, paypalAccount: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('admin.achRouting')}
                  value={addForm.achRoutingNumber}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      achRoutingNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <input
                className={inp}
                placeholder={t('admin.achAccount')}
                value={addForm.achAccountNumber}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    achAccountNumber: e.target.value,
                  }))
                }
              />
              <button
                type="submit"
                disabled={punchInTakenAdd}
                className="rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t('admin.createMember')}
              </button>
            </form>
            {addSaveMsg && (
              <p className="mt-2 text-xs text-red-600">{addSaveMsg}</p>
            )}
          </div>
        </div>
      )}

      {viewMember && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[min(90dvh,100%)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
                {viewMember.displayName}
              </h3>
              <div className="flex shrink-0 items-start gap-3">
                <div className="text-right">
                  <span className="block text-[11px] text-slate-500">
                    {t('admin.memberSince')}
                  </span>
                  <span className="block max-w-[11rem] whitespace-normal text-[11px] font-medium leading-snug text-slate-600 sm:max-w-none sm:whitespace-nowrap">
                    {new Date(viewMember.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  className={MODAL_TEXT_BTN}
                  onClick={() => setViewMember(null)}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
            <dl className="space-y-0 divide-y divide-slate-100 text-slate-700">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.phone')}</dt>
                <dd className="text-right text-slate-900">{viewMember.phone}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.loginPinPh')}</dt>
                <dd className="text-right text-slate-600">
                  {t('admin.loginPinStored')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.punchInPh')}</dt>
                <dd className="text-right font-mono text-slate-900">
                  {viewMember.attendanceCode}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.status')}</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.isApproved
                    ? t('admin.statusApproved')
                    : t('admin.statusPendingApproval')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.address')}</dt>
                <dd
                  className="min-w-0 max-w-[min(100%,20rem)] truncate text-right text-slate-900"
                  title={[
                    viewMember.addressLine1,
                    [
                      viewMember.city,
                      viewMember.stateRegion,
                      viewMember.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                >
                  {(() => {
                    const cityLine = [
                      viewMember.city,
                      viewMember.stateRegion,
                      viewMember.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')
                    const streetLine = viewMember.addressLine1 ?? ''
                    const one = [streetLine, cityLine].filter(Boolean).join(' · ')
                    return one || t('common.dash')
                  })()}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('billing.zelleYou')}</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.zellePhone || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('billing.zelleSpouse')}</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.wifeZellePhone || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.labelEmail')}</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.email || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.spousePhone')}</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.spousePhone || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.spouseEmail')}</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.spouseEmail || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('billing.paypal')}</dt>
                <dd className="break-all text-right text-slate-900">
                  {viewMember.paypalAccount || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.labelAchRouting')}</dt>
                <dd className="text-right text-slate-900">
                  {viewMember.achRoutingNumber || t('common.dash')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 sm:items-start">
                <dt className="text-slate-500">{t('admin.labelAchAccount')}</dt>
                <dd className="text-right text-slate-900">
                  {maskBankTail(viewMember.achAccountNumber)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] text-slate-500 sm:text-[11px]">
              <Trans
                i18nKey="admin.signInFootnote"
                components={{ strong: <strong /> }}
              />
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  openEdit(viewMember)
                  setViewMember(null)
                }}
              >
                {t('admin.editSave')}
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-medium text-red-900 hover:bg-red-100"
                onClick={() => void deleteMember(viewMember.id)}
              >
                {t('admin.deleteMember')}
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2.5 sm:ml-auto ${MODAL_TEXT_BTN}`}
                onClick={() => setViewMember(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('admin.editMember')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => setEditMember(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
            <form onSubmit={saveEdit} className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('signup.firstName')}
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
                <input
                  className={inp}
                  placeholder={t('signup.lastName')}
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>
              <label className={lbl}>
                {t('admin.phone')}
                <PhoneInput
                  className={inp}
                  value={editForm.phoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, phoneDigits: d }))
                  }
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>
                  {t('admin.loginPinEdit')}
                  <input
                    type="password"
                    className={`${inp} ${
                      editPin.length > 0 && editPin.length < 4
                        ? 'border-red-500 ring-1 ring-red-200'
                        : ''
                    }`}
                    placeholder={t('admin.newPinPh')}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className={lbl}>
                  {t('admin.punchInEdit')}
                  <input
                    className={`${inp} font-mono ${
                      punchInTakenEdit
                        ? 'border-red-500 ring-1 ring-red-200'
                        : ''
                    }`}
                    placeholder={t('admin.punchInPh')}
                    value={editForm.attendanceCode}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        attendanceCode: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
              {punchInTakenEdit && (
                <p className="text-xs text-red-600">{t('admin.punchInTaken')}</p>
              )}
              <label className={lbl}>
                {t('admin.street1')}
                <input
                  className={inp}
                  value={editForm.addressLine1}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, addressLine1: e.target.value }))
                  }
                />
              </label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  className={inp}
                  placeholder={t('signup.city')}
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('signup.state')}
                  value={editForm.stateRegion}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, stateRegion: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('signup.zip')}
                  value={editForm.postalCode}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      postalCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={editForm.isMarried}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        isMarried: e.target.checked,
                      }))
                    }
                  />
                  {t('admin.marriedLabel')}
                </label>
                <label className={lbl}>
                  {t('admin.bonusRecipientLabel')}
                  <select
                    className={inp}
                    value={editForm.bonusRecipient}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        bonusRecipient: e.target.value as 'SELF' | 'WIFE',
                      }))
                    }
                  >
                    <option value="WIFE">{t('billing.toSpouseZelle')}</option>
                    <option value="SELF">{t('billing.toYourZelle')}</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('admin.zellePlaceholder')}
                  value={editForm.zellePhone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, zellePhone: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('admin.spouseZellePlaceholder')}
                  value={editForm.wifeZellePhone}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      wifeZellePhone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  type="email"
                  autoComplete="email"
                  placeholder={t('signup.emailOpt')}
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <label className={lbl}>
                  {t('admin.spousePhone')}
                  <PhoneInput
                    className={inp}
                    value={editForm.spousePhoneDigits}
                    onChange={(d) =>
                      setEditForm((f) => ({ ...f, spousePhoneDigits: d }))
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  type="email"
                  placeholder={t('admin.spouseEmail')}
                  value={editForm.spouseEmail}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, spouseEmail: e.target.value }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('admin.paypalPh')}
                  value={editForm.paypalAccount}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      paypalAccount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inp}
                  placeholder={t('admin.achRouting')}
                  inputMode="numeric"
                  value={editForm.achRoutingNumber}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      achRoutingNumber: e.target.value,
                    }))
                  }
                />
                <input
                  className={inp}
                  placeholder={t('admin.achAccount')}
                  inputMode="numeric"
                  autoComplete="off"
                  value={editForm.achAccountNumber}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      achAccountNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={editMember.isApproved}
                  onChange={(e) =>
                    setEditMember((m) =>
                      m ? { ...m, isApproved: e.target.checked } : m
                    )
                  }
                />
                {t('admin.approvedActive')}
              </label>
              <button
                type="submit"
                disabled={punchInTakenEdit}
                className="rounded-lg bg-blue-600 py-2.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('admin.saveChanges')}
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 bg-red-50 py-2.5 text-[11px] font-semibold text-red-800 hover:bg-red-100"
                onClick={() => void deleteMember(editMember.id)}
              >
                {t('admin.deleteMember')}
              </button>
            </form>
            {editSaveMsg && (
              <p className="mt-2 text-xs text-red-600">{editSaveMsg}</p>
            )}
          </div>
        </div>
      )}


      {showAddLocation && (
        <div className={MODAL_BACKDROP}>
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {t('admin.addLocationModalTitle')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => {
                  setShowAddLocation(false)
                  setAddLocMsg(null)
                }}
              >
                {t('common.close')}
              </button>
            </div>
            <form className="grid gap-2" onSubmit={submitAddLocation}>
              <label className="text-xs text-slate-600">
                {t('admin.addLocationSlug')}
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono"
                  value={newLocSlug}
                  onChange={(e) =>
                    setNewLocSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  placeholder="new-site"
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.addLocationInternalName')}
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.addLocationDisplayName')}
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={newLocSynagogue}
                  onChange={(e) => setNewLocSynagogue(e.target.value)}
                  placeholder={t('admin.addLocationDisplayPlaceholder')}
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  {t('admin.addLocationSubmit')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700"
                  onClick={() => {
                    setShowAddLocation(false)
                    setAddLocMsg(null)
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
            {addLocMsg && (
              <p className="mt-2 text-[11px] text-slate-600">{addLocMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

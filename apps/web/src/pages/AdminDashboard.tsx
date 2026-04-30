import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PhoneInput } from '../components/PhoneInput'

const KEY = 'minyan_admin_token'

type SessionResp = {
  dateKey: string
  sessionId: string
  attendances: {
    id: string
    punchInAt: string
    punchInStatus: string
    punchOutAt: string | null
    wouldBeFirstNine: boolean
    user: {
      id: string
      firstName: string
      lastName: string
      displayName: string
      phone: string
      attendanceCode: string
    }
  }[]
}

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
  addressLine2: string | null
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
  createdAt: string
}

type AttendanceTxn = {
  id: string
  sessionId: string
  sessionDateKey: string
  userId: string
  userDisplayName: string
  userPhone: string
  userPunchInCode: string
  punchInAt: string
  punchInStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  punchInConfirmedAt: string | null
  punchOutAt: string | null
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
    addressLine2: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    email: '',
    spousePhoneDigits: '',
    spouseEmail: '',
    paypalAccount: '',
    achRoutingNumber: '',
    achAccountNumber: '',
  }
}

function phoneDigitsFromE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits.slice(0, 10)
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
  const token = localStorage.getItem(KEY)
  const [session, setSession] = useState<SessionResp | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [settings, setSettings] = useState<{
    slug: string
    name: string
    synagogueName?: string
    locationAddress?: string | null
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
  } | null>(null)
  const [attendanceTxns, setAttendanceTxns] = useState<AttendanceTxn[]>([])
  const [editTxn, setEditTxn] = useState<AttendanceTxn | null>(null)
  const [editTxnMsg, setEditTxnMsg] = useState<string | null>(null)
  const [editTxnForm, setEditTxnForm] = useState<{
    punchInAtLocal: string
    punchOutAtLocal: string
    punchInStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  }>({
    punchInAtLocal: '',
    punchOutAtLocal: '',
    punchInStatus: 'PENDING',
  })
  const [locationNameDraft, setLocationNameDraft] = useState('')
  const [locationAddressDraft, setLocationAddressDraft] = useState('')
  const [locationPhoneDraft, setLocationPhoneDraft] = useState('')
  const [locationEmailDraft, setLocationEmailDraft] = useState('')
  const [locationWebsiteDraft, setLocationWebsiteDraft] = useState('')
  const [locationLocaleDraft, setLocationLocaleDraft] = useState<
    'en' | 'he' | 'es' | 'ru' | 'fr'
  >('he')
  const [locationSetupMsg, setLocationSetupMsg] = useState<string | null>(null)
  const [isLocationEditing, setIsLocationEditing] = useState(false)
  const [rabbis, setRabbis] = useState<RabbiProfile[]>([])
  const [rabbiEditId, setRabbiEditId] = useState<string | null>(null)
  const [rabbiNameDraft, setRabbiNameDraft] = useState('')
  const [rabbiAddressDraft, setRabbiAddressDraft] = useState('')
  const [rabbiCityDraft, setRabbiCityDraft] = useState('')
  const [rabbiStateDraft, setRabbiStateDraft] = useState('')
  const [rabbiZipDraft, setRabbiZipDraft] = useState('')
  const [rabbiPhoneDraft, setRabbiPhoneDraft] = useState('')
  const [rabbiEmailDraft, setRabbiEmailDraft] = useState('')
  const [rabbiPasswordDraft, setRabbiPasswordDraft] = useState('')
  const [rabbiSetupMsg, setRabbiSetupMsg] = useState<string | null>(null)
  const [adminPwdCurrent, setAdminPwdCurrent] = useState('')
  const [adminPwdNew, setAdminPwdNew] = useState('')
  const [adminPwdConfirm, setAdminPwdConfirm] = useState('')
  const [adminPwdNotice, setAdminPwdNotice] = useState<{
    kind: 'ok' | 'err'
    text: string
  } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [memberMsg, setMemberMsg] = useState<string | null>(null)
  const [viewMember, setViewMember] = useState<MemberRow | null>(null)
  const [editMember, setEditMember] = useState<MemberRow | null>(null)
  const [editForm, setEditForm] = useState(() => emptyMemberForm())
  const [editPin, setEditPin] = useState('')
  const [editSaveMsg, setEditSaveMsg] = useState<string | null>(null)
  /** overview | approvals | members | today | add | checkio */
  const [adminTab, setAdminTab] = useState<
    'overview' | 'approvals' | 'members' | 'today' | 'add' | 'checkio'
  >('overview')
  const prevAdminTab = useRef(adminTab)

  useEffect(() => {
    const prev = prevAdminTab.current
    prevAdminTab.current = adminTab
    if (adminTab !== prev) {
      setMemberMsg(null)
    }
  }, [adminTab])

  const load = useCallback(async () => {
    if (!token) {
      nav('/admin')
      return
    }
    try {
      const [s, st, m, tx, rb] = await Promise.all([
        api<SessionResp>('/api/admin/session/today', { token }),
        api<{
          slug: string
          name: string
          synagogueName?: string
          locationAddress?: string | null
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
        }>('/api/admin/settings', { token }),
        api<MemberRow[]>('/api/admin/members', { token }),
        api<AttendanceTxn[]>('/api/admin/attendance', { token }),
        api<RabbiProfile[]>('/api/admin/rabbis', { token }),
      ])
      setSession(s)
      setSettings(st)
      setLocationNameDraft(st.synagogueName ?? '')
      setLocationAddressDraft(st.locationAddress ?? '')
      setLocationPhoneDraft(st.locationPhone ?? '')
      setLocationEmailDraft(st.locationEmail ?? '')
      setLocationWebsiteDraft(st.locationWebsite ?? '')
      setLocationLocaleDraft(st.defaultLocale ?? 'he')
      setRabbis(rb)
      setMembers(m)
      setAttendanceTxns(tx)
      setErr(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('admin.loadFailed'))
    }
  }, [token, nav, t])

  useEffect(() => {
    void load()
  }, [load])

  function openEdit(m: MemberRow) {
    setEditMember(m)
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
      addressLine2: m.addressLine2 ?? '',
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
        addressLine1: editForm.addressLine1.trim() || null,
        addressLine2: editForm.addressLine2.trim() || null,
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
      setMemberMsg(t('admin.memberDeleted'))
      await load()
    } catch (e: unknown) {
      setEditSaveMsg(e instanceof Error ? e.message : t('admin.deleteFailed'))
    }
  }

  async function confirm(id: string) {
    if (!token) return
    await api(`/api/admin/attendance/${id}/confirm`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  async function reject(id: string) {
    if (!token) return
    await api(`/api/admin/attendance/${id}/reject`, {
      method: 'POST',
      token,
      body: '{}',
    })
    await load()
  }

  function memberRowForUserId(userId: string): MemberRow | undefined {
    return members.find((m) => m.id === userId)
  }

  async function saveEditTxn(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editTxn) return
    setEditTxnMsg(null)
    if (!editTxnForm.punchInAtLocal) {
      setEditTxnMsg(t('admin.punchInRequired'))
      return
    }
    try {
      await api(`/api/admin/attendance/${editTxn.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          punchInAt: new Date(editTxnForm.punchInAtLocal).toISOString(),
          punchOutAt: editTxnForm.punchOutAtLocal
            ? new Date(editTxnForm.punchOutAtLocal).toISOString()
            : null,
          punchInStatus: editTxnForm.punchInStatus,
        }),
      })
      setEditTxn(null)
      setMemberMsg(t('admin.txnUpdated'))
      await load()
    } catch (e: unknown) {
      setEditTxnMsg(e instanceof Error ? e.message : t('admin.updateFailed'))
    }
  }

  async function deleteTxn(id: string) {
    if (!token) return
    if (
      !window.confirm(t('admin.deleteTxnConfirm'))
    ) {
      return
    }
    setEditTxnMsg(null)
    try {
      await api(`/api/admin/attendance/${id}`, { method: 'DELETE', token })
      setEditTxn((v) => (v?.id === id ? null : v))
      setMemberMsg(t('admin.txnDeleted'))
      await load()
    } catch (e: unknown) {
      setEditTxnMsg(e instanceof Error ? e.message : t('admin.deleteFailed'))
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
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          synagogueName: trimmedName,
          locationAddress: locationAddressDraft.trim() || null,
          locationPhone: locationPhoneDraft.trim() || null,
          locationEmail: locationEmailDraft.trim() || null,
          locationWebsite: locationWebsiteDraft.trim() || null,
          defaultLocale: locationLocaleDraft,
        }),
      })
      setIsLocationEditing(false)
      setLocationSetupMsg(t('admin.locationSaved'))
      await load()
    } catch (e: unknown) {
      setLocationSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
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
          locationPhone: null,
          locationEmail: null,
          locationWebsite: null,
        }),
      })
      setIsLocationEditing(false)
      setLocationSetupMsg(t('admin.locationDeleted'))
      await load()
    } catch (e: unknown) {
      setLocationSetupMsg(e instanceof Error ? e.message : t('admin.saveFailed'))
    }
  }

  async function submitAdminPasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setAdminPwdNotice(null)
    if (adminPwdNew.length < 4) {
      setAdminPwdNotice({
        kind: 'err',
        text: t('admin.adminPasswordTooShort'),
      })
      return
    }
    if (adminPwdNew !== adminPwdConfirm) {
      setAdminPwdNotice({
        kind: 'err',
        text: t('admin.adminPasswordMismatch'),
      })
      return
    }
    try {
      await api('/api/admin/change-admin-password', {
        method: 'POST',
        token,
        body: JSON.stringify({
          currentPassword: adminPwdCurrent,
          newPassword: adminPwdNew,
        }),
      })
      setAdminPwdCurrent('')
      setAdminPwdNew('')
      setAdminPwdConfirm('')
      setAdminPwdNotice({
        kind: 'ok',
        text: t('admin.adminPasswordUpdated'),
      })
    } catch (e: unknown) {
      setAdminPwdNotice({
        kind: 'err',
        text: e instanceof Error ? e.message : t('admin.saveFailed'),
      })
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
  }

  async function saveRabbiSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setRabbiSetupMsg(null)
    if (!rabbiNameDraft.trim()) {
      setRabbiSetupMsg(t('admin.rabbiNameRequired'))
      return
    }
    if (rabbiPasswordDraft && rabbiPasswordDraft.trim().length < 4) {
      setRabbiSetupMsg(t('admin.rabbiPasswordRule'))
      return
    }
    try {
      const body = JSON.stringify({
        name: rabbiNameDraft.trim(),
        address: rabbiAddressDraft.trim() || null,
        city: rabbiCityDraft.trim() || null,
        stateRegion: rabbiStateDraft.trim() || null,
        postalCode: rabbiZipDraft.trim() || null,
        phone: rabbiPhoneDraft.trim() || null,
        email: rabbiEmailDraft.trim() || null,
      })
      await api(rabbiEditId ? `/api/admin/rabbis/${rabbiEditId}` : '/api/admin/rabbis', {
        method: rabbiEditId ? 'PATCH' : 'POST',
        token,
        body,
      })
      if (rabbiPasswordDraft.trim()) {
        await api('/api/admin/settings', {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            rabbiPassword: rabbiPasswordDraft.trim(),
          }),
        })
      }
      setRabbiPasswordDraft('')
      resetRabbiForm()
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

  const tabBtn = (id: typeof adminTab, label: string) => {
    const on = adminTab === id
    return (
      <button
        key={id}
        type="button"
        className={`rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium uppercase leading-tight sm:text-xs ${
          on
            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
        onClick={() => setAdminTab(id)}
      >
        {label}
      </button>
    )
  }

  const checkedInCount = session?.attendances.length ?? 0
  const pendingApprovalCount = members.filter((m) => !m.isApproved).length
  const punchInTakenEdit = useMemo(
    () =>
      editMember
        ? isPunchInCodeTaken(members, editForm.attendanceCode, editMember.id)
        : false,
    [members, editForm.attendanceCode, editMember]
  )

  const fmtAttendanceStatus = (s: string) =>
    s === 'PENDING'
      ? t('admin.statusPending')
      : s === 'CONFIRMED'
        ? t('admin.statusConfirmed')
        : t('admin.statusRejected')

  if (!token) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/"
          className="text-[11px] text-slate-500 hover:text-slate-700 sm:text-xs"
        >
          {t('admin.home')}
        </Link>
        <button
          type="button"
          className="text-[11px] text-slate-500 sm:text-xs"
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
        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
          {adminTab === 'overview' && t('admin.subOverview')}
          {adminTab === 'approvals' &&
            t('admin.subApprovals', { count: pendingApprovalCount })}
          {adminTab === 'members' &&
            t('admin.subMembers', { count: members.length })}
          {adminTab === 'today' &&
            (session
              ? t('admin.subToday', {
                  date: session.dateKey,
                  count: checkedInCount,
                })
              : t('common.loading'))}
          {adminTab === 'add' && t('admin.subAdd')}
          {adminTab === 'checkio' &&
            t('admin.subCheckIo', { count: attendanceTxns.length })}
        </p>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {memberMsg && <p className="text-xs text-slate-600">{memberMsg}</p>}

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={t('admin.navAria')}>
        {tabBtn('overview', t('admin.tabOverview'))}
        {tabBtn(
          'members',
          pendingApprovalCount
            ? t('admin.tabMembersPending', {
                count: pendingApprovalCount,
              })
            : t('admin.tabMembersAll')
        )}
        {tabBtn('today', t('admin.tabToday'))}
        {tabBtn('add', t('admin.tabAdd'))}
      </nav>

      {adminTab === 'overview' && (
        <>
      {settings && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-xs sm:text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-medium text-slate-800">{t('admin.locationSetupTitle')}</h2>
            <button
              type="button"
              className="text-xs text-blue-700 underline decoration-blue-400"
              onClick={() => setIsLocationEditing((v) => !v)}
            >
              {isLocationEditing ? t('common.view') : t('admin.editSave')}
            </button>
          </div>
          {!isLocationEditing ? (
            <dl className="grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
              <div><dt className="font-medium">{t('admin.locationDisplayName')}</dt><dd>{settings.synagogueName || '—'}</dd></div>
              <div><dt className="font-medium">{t('admin.phone')}</dt><dd>{settings.locationPhone || '—'}</dd></div>
              <div><dt className="font-medium">{t('admin.labelEmail')}</dt><dd>{settings.locationEmail || '—'}</dd></div>
              <div><dt className="font-medium">{t('admin.website')}</dt><dd>{settings.locationWebsite || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="font-medium">{t('admin.address')}</dt><dd>{settings.locationAddress || '—'}</dd></div>
            </dl>
          ) : (
            <form className="grid gap-2" onSubmit={saveLocationSetup}>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-600">
                  {t('admin.locationDisplayName')}
                  <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={locationNameDraft} onChange={(e) => setLocationNameDraft(e.target.value)} />
                </label>
                <label className="text-xs text-slate-600">
                  {t('admin.phone')}
                  <PhoneInput className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={phoneDigitsFromE164(locationPhoneDraft)} onChange={setLocationPhoneDraft} />
                </label>
              </div>
              <label className="text-xs text-slate-600">
                {t('admin.address')}
                <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={locationAddressDraft} onChange={(e) => setLocationAddressDraft(e.target.value)} />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-600">
                  {t('admin.labelEmail')}
                  <input type="email" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={locationEmailDraft} onChange={(e) => setLocationEmailDraft(e.target.value)} />
                </label>
                <label className="text-xs text-slate-600">
                  {t('admin.website')}
                  <input type="url" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={locationWebsiteDraft} onChange={(e) => setLocationWebsiteDraft(e.target.value)} />
                </label>
              </div>
              <label className="text-xs text-slate-600">
                {t('admin.locationDefaultLanguage')}
                <select className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={locationLocaleDraft} onChange={(e) => setLocationLocaleDraft(e.target.value as 'en' | 'he' | 'es' | 'ru' | 'fr')}>
                  <option value="he">{t('lang.he')}</option>
                  <option value="en">{t('lang.en')}</option>
                  <option value="es">{t('lang.es')}</option>
                  <option value="ru">{t('lang.ru')}</option>
                  <option value="fr">{t('lang.fr')}</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">{t('admin.saveLocationSetup')}</button>
                <button type="button" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100" onClick={() => void clearLocationSetup()}>{t('common.delete')}</button>
              </div>
            </form>
          )}
          {locationSetupMsg && (
            <p className="mt-2 text-[11px] text-slate-500">{locationSetupMsg}</p>
          )}
        </div>
      )}

      {settings && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-xs sm:text-sm">
          <h2 className="mb-2 font-medium text-slate-800">
            {t('admin.changeAdminPasswordTitle')}
          </h2>
          <p className="mb-3 text-[11px] text-slate-500 sm:text-xs">
            {t('admin.changeAdminPasswordHelp')}
          </p>
          <form className="grid max-w-md gap-2" onSubmit={submitAdminPasswordChange}>
            <label className="text-xs text-slate-600">
              {t('admin.adminCurrentPassword')}
              <input
                type="password"
                className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                value={adminPwdCurrent}
                onChange={(e) => setAdminPwdCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="text-xs text-slate-600">
              {t('admin.adminNewPassword')}
              <input
                type="password"
                className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                value={adminPwdNew}
                onChange={(e) => setAdminPwdNew(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="text-xs text-slate-600">
              {t('admin.adminConfirmPassword')}
              <input
                type="password"
                className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                value={adminPwdConfirm}
                onChange={(e) => setAdminPwdConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              className="mt-1 w-fit rounded bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900"
            >
              {t('admin.adminPasswordSubmit')}
            </button>
          </form>
          {adminPwdNotice && (
            <p
              className={`mt-2 text-[11px] ${
                adminPwdNotice.kind === 'ok'
                  ? 'text-emerald-700'
                  : 'text-red-600'
              }`}
            >
              {adminPwdNotice.text}
            </p>
          )}
        </div>
      )}

      {settings && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-xs sm:text-sm">
          <h2 className="mb-2 font-medium text-slate-800">{t('admin.rabbiSetupTitle')}</h2>
          <p className="mb-2 text-[11px] text-slate-500 sm:text-xs">{t('admin.rabbiSetupLinkHint')}</p>
          <ul className="mb-3 grid gap-2">
            {rabbis.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                <div className="min-w-0 text-[11px]">
                  <p className="truncate font-medium text-slate-800">{r.name}</p>
                  <p className="truncate text-slate-600">{r.phone || '—'} · {r.email || '—'}</p>
                  <p className="truncate text-slate-500">{[r.city, r.stateRegion, r.postalCode].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  <button type="button" className="text-blue-700 underline decoration-blue-400" onClick={() => beginEditRabbi(r)}>{t('admin.editSave')}</button>
                  <button type="button" className="text-red-700 underline decoration-red-400" onClick={() => void deleteRabbi(r.id)}>{t('common.delete')}</button>
                </div>
              </li>
            ))}
            {rabbis.length === 0 && <li className="text-[11px] text-slate-500">{t('admin.noRabbisYet')}</li>}
          </ul>
          <form className="grid gap-2" onSubmit={saveRabbiSetup}>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-600">
                {t('admin.rabbiName')}
                <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiNameDraft} onChange={(e) => setRabbiNameDraft(e.target.value)} />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.phone')}
                <PhoneInput className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiPhoneDraft} onChange={setRabbiPhoneDraft} />
              </label>
            </div>
            <label className="text-xs text-slate-600">
              {t('admin.address')}
              <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiAddressDraft} onChange={(e) => setRabbiAddressDraft(e.target.value)} />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs text-slate-600">
                {t('signup.city')}
                <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiCityDraft} onChange={(e) => setRabbiCityDraft(e.target.value)} />
              </label>
              <label className="text-xs text-slate-600">
                {t('signup.state')}
                <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiStateDraft} onChange={(e) => setRabbiStateDraft(e.target.value)} />
              </label>
              <label className="text-xs text-slate-600">
                {t('signup.zip')}
                <input className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiZipDraft} onChange={(e) => setRabbiZipDraft(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-600">
                {t('admin.labelEmail')}
                <input type="email" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiEmailDraft} onChange={(e) => setRabbiEmailDraft(e.target.value)} />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.rabbiPasswordLabel')}
                <input type="password" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1" value={rabbiPasswordDraft} onChange={(e) => setRabbiPasswordDraft(e.target.value)} autoComplete="new-password" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                {rabbiEditId ? t('admin.saveRabbiSetup') : t('admin.addRabbi')}
              </button>
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={resetRabbiForm}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
          {rabbiSetupMsg && (
            <p className="mt-2 text-[11px] text-slate-500">{rabbiSetupMsg}</p>
          )}
        </div>
      )}
        </>
      )}

      {adminTab === 'approvals' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
          <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
            {t('admin.approvalsHeader', { count: pendingApprovalCount })}
          </h2>
          <p className="mb-2 text-[11px] text-slate-500 sm:text-xs">
            {t('admin.approvalsHelp')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {members
              .filter((m) => !m.isApproved)
              .map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-amber-200/90 bg-amber-50/80 px-2.5 py-2 text-[11px] leading-snug text-slate-700 sm:text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {m.displayName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-slate-500 sm:text-[11px]">
                        {t('admin.punchInLine', {
                          phone: m.phone,
                          code: m.attendanceCode,
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        type="button"
                        className="text-blue-600/90 active:underline"
                        onClick={() => setViewMember(m)}
                      >
                        {t('common.view')}
                      </button>
                      <button
                        type="button"
                        className="text-emerald-700 active:underline"
                        onClick={() => void approveMember(m.id)}
                      >
                        {t('admin.approve')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
          {pendingApprovalCount === 0 && (
            <p className="text-xs text-slate-500">{t('admin.noPendingApprovals')}</p>
          )}
        </div>
      )}

      {adminTab === 'members' && (
      <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
        <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
          {t('admin.allMembersHeader', { count: members.length })}
        </h2>
        <p className="mb-2 text-[11px] text-slate-500 sm:text-xs">
          {t('admin.allMembersHelp')}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-md border border-slate-200/90 bg-slate-50 px-2.5 py-2 text-[11px] leading-snug text-slate-700 sm:text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {m.displayName}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500 sm:text-[11px]">
                    {t('admin.punchInLine', {
                      phone: m.phone,
                      code: m.attendanceCode,
                    })}
                  </p>
                  <p className="mt-0.5">
                    {m.isApproved ? (
                      <span className="text-emerald-600">{t('admin.active')}</span>
                    ) : (
                      <span className="text-blue-600">{t('admin.pending')}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    className="text-blue-600/90 active:underline"
                    onClick={() => setViewMember(m)}
                  >
                    {t('common.view')}
                  </button>
                  <button
                    type="button"
                    className="text-slate-700 active:underline"
                    onClick={() => openEdit(m)}
                  >
                    {t('admin.editSave')}
                  </button>
                  <button
                    type="button"
                    className="text-red-700/90 active:underline"
                    onClick={() => void deleteMember(m.id)}
                  >
                    {t('common.delete')}
                  </button>
                  {!m.isApproved && (
                    <button
                      type="button"
                      className="text-emerald-600 active:underline"
                      onClick={() => void approveMember(m.id)}
                    >
                      {t('admin.approve')}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {members.length === 0 && (
          <p className="text-xs text-slate-500">{t('admin.noMembers')}</p>
        )}
      </div>
      )}

      {adminTab === 'add' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
          <h2 className="mb-2 text-xs font-medium text-slate-700 sm:text-sm">
            {t('admin.addMemberTitle')}
          </h2>
          <p className="text-[11px] text-slate-500 sm:text-xs">
            {t('admin.addUsesJoinRegister')}
          </p>
          <Link
            to="/member/signup"
            className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('home.signupCta')}
          </Link>
        </div>
      )}

      {adminTab === 'today' && session && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-3">
          <h2 className="mb-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            {t('admin.checkedInToday', {
              count: session.attendances.length,
              date: session.dateKey,
            })}
          </h2>
          <p className="mb-3 text-[11px] text-slate-500 sm:text-xs">
            {t('admin.todayHelp')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {session.attendances.map((a) => {
              const row = memberRowForUserId(a.user.id)
              return (
                <li
                  key={a.id}
                  className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] leading-snug sm:text-xs"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {a.user.displayName}
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        {new Date(a.punchInAt).toLocaleString()} ·{' '}
                        <span
                          className={
                            a.punchInStatus === 'CONFIRMED'
                              ? 'text-emerald-700'
                              : a.punchInStatus === 'PENDING'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }
                        >
                          {fmtAttendanceStatus(a.punchInStatus)}
                        </span>
                        {a.punchOutAt
                          ? t('admin.outAt', {
                              time: new Date(a.punchOutAt).toLocaleTimeString(),
                            })
                          : t('admin.noPunchOut')}
                      </p>
                      {a.punchInStatus === 'CONFIRMED' && (
                        <p className="mt-1 text-[10px] text-blue-700/85 sm:text-[11px]">
                          {t('admin.firstNine')}{' '}
                          {a.wouldBeFirstNine
                            ? t('admin.firstNineYes')
                            : t('admin.firstNineNo')}
                        </p>
                      )}
                    </div>
                    {a.punchInStatus === 'PENDING' && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="rounded bg-emerald-800 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-700 sm:text-xs"
                          onClick={() => void confirm(a.id)}
                        >
                          {t('admin.confirm')}
                        </button>
                        <button
                          type="button"
                          className="rounded bg-slate-700 px-2.5 py-1 text-[11px] text-white hover:bg-slate-600 sm:text-xs"
                          onClick={() => void reject(a.id)}
                        >
                          {t('admin.reject')}
                        </button>
                      </div>
                    )}
                    {row && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-200/90 pt-2 text-[11px] sm:text-xs">
                        <button
                          type="button"
                          className="text-blue-600/95 hover:underline"
                          onClick={() => setViewMember(row)}
                        >
                          {t('common.view')}
                        </button>
                        <button
                          type="button"
                          className="text-slate-700 hover:underline"
                          onClick={() => openEdit(row)}
                        >
                          {t('admin.editSave')}
                        </button>
                        <button
                          type="button"
                          className="text-red-700/90 hover:underline"
                          onClick={() => void deleteMember(row.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {session.attendances.length === 0 && (
            <p className="text-xs text-slate-500">{t('admin.noPunchInsToday')}</p>
          )}
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
                    [viewMember.addressLine1, viewMember.addressLine2]
                      .filter(Boolean)
                      .join(', '),
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
                    const streetLine = [
                      viewMember.addressLine1,
                      viewMember.addressLine2,
                    ]
                      .filter(Boolean)
                      .join(', ')
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
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
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
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder={t('signup.firstName')}
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder={t('signup.lastName')}
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>
              <label className="text-xs text-slate-400">
                {t('admin.phone')}
                <PhoneInput
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editForm.phoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, phoneDigits: d }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.loginPinEdit')}
                <input
                  type="password"
                  className={`mt-1 w-full rounded border bg-white px-2 py-1 ${
                    editPin.length > 0 && editPin.length < 4
                      ? 'border-red-500 ring-1 ring-red-200'
                      : 'border-slate-200'
                  }`}
                  placeholder={t('admin.newPinPh')}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.punchInEdit')}
                <input
                  className={`mt-1 w-full rounded border bg-white px-2 py-1 font-mono ${
                    punchInTakenEdit
                      ? 'border-red-500 ring-1 ring-red-200'
                      : 'border-slate-200'
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
              {punchInTakenEdit && (
                <p className="text-xs text-red-600">{t('admin.punchInTaken')}</p>
              )}
              <p className="text-xs text-slate-500">{t('admin.address')}</p>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder={t('admin.street1')}
                value={editForm.addressLine1}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine1: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder={t('admin.street2')}
                value={editForm.addressLine2}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, addressLine2: e.target.value }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder={t('signup.city')}
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder={t('signup.state')}
                  value={editForm.stateRegion}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, stateRegion: e.target.value }))
                  }
                />
                <input
                  className="rounded border border-slate-200 bg-white px-2 py-1"
                  placeholder={t('signup.zip')}
                  value={editForm.postalCode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, postalCode: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  checked={editForm.isMarried}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, isMarried: e.target.checked }))
                  }
                />
                {t('admin.marriedLabel')}
              </label>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder={t('admin.zellePlaceholder')}
                value={editForm.zellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, zellePhone: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder={t('admin.spouseZellePlaceholder')}
                value={editForm.wifeZellePhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, wifeZellePhone: e.target.value }))
                }
              />
              <p className="text-xs text-slate-500">{t('admin.contactPayment')}</p>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                type="email"
                autoComplete="email"
                placeholder={t('signup.emailOpt')}
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <label className="text-xs text-slate-400">
                {t('admin.spousePhone')}
                <PhoneInput
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editForm.spousePhoneDigits}
                  onChange={(d) =>
                    setEditForm((f) => ({ ...f, spousePhoneDigits: d }))
                  }
                />
              </label>
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                type="email"
                placeholder={t('admin.spouseEmail')}
                value={editForm.spouseEmail}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, spouseEmail: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
                placeholder={t('admin.paypalPh')}
                value={editForm.paypalAccount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, paypalAccount: e.target.value }))
                }
              />
              <input
                className="rounded border border-slate-200 bg-white px-2 py-1"
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
                className="rounded border border-slate-200 bg-white px-2 py-1"
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
              <label className="flex items-center gap-2 text-slate-400">
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
                className="rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('admin.saveChanges')}
              </button>
              <button
                type="button"
                className="rounded border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
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

      {editTxn && (
        <div className={MODAL_BACKDROP}>
          <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xl sm:text-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {t('admin.editCheckIo')}
              </h3>
              <button
                type="button"
                className={MODAL_TEXT_BTN}
                onClick={() => setEditTxn(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {editTxn.userDisplayName} · {editTxn.userPhone}
            </p>
            <form onSubmit={saveEditTxn} className="grid gap-2">
              <label className="text-xs text-slate-600">
                {t('admin.punchInDt')}
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchInAtLocal}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({ ...f, punchInAtLocal: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.punchOutDt')}
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchOutAtLocal}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({ ...f, punchOutAtLocal: e.target.value }))
                  }
                />
              </label>
              <label className="text-xs text-slate-600">
                {t('admin.status')}
                <select
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1"
                  value={editTxnForm.punchInStatus}
                  onChange={(e) =>
                    setEditTxnForm((f) => ({
                      ...f,
                      punchInStatus: e.target.value as
                        | 'PENDING'
                        | 'CONFIRMED'
                        | 'REJECTED',
                    }))
                  }
                >
                  <option value="PENDING">{t('admin.statusPending')}</option>
                  <option value="CONFIRMED">{t('admin.statusConfirmed')}</option>
                  <option value="REJECTED">{t('admin.statusRejected')}</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
              >
                {t('admin.saveChanges')}
              </button>
              <button
                type="button"
                className="rounded border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
                onClick={() => void deleteTxn(editTxn.id)}
              >
                {t('admin.deleteTxn')}
              </button>
            </form>
            {editTxnMsg && (
              <p className="mt-2 text-xs text-red-600">{editTxnMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

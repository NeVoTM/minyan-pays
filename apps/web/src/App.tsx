import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClockBar } from './components/ClockBar'
import { MobileNav } from './components/MobileNav'
import { RabbiBanner } from './components/RabbiBanner'
import { PunchMenu } from './pages/PunchMenu'
import { PunchIn } from './pages/PunchIn'
import { PunchOut } from './pages/PunchOut'
import { AdminLogin } from './pages/AdminLogin'
import { AdminChangePassword } from './pages/AdminChangePassword'
import { AdminDashboard } from './pages/AdminDashboard'
import { RabbiLogin } from './pages/RabbiLogin'
import { RabbiDashboard } from './pages/RabbiDashboard'
import { MemberLogin } from './pages/MemberLogin'
import { MemberDashboard } from './pages/MemberDashboard'
import { MemberSignup } from './pages/MemberSignup'
import { MemberBilling } from './pages/MemberBilling'
import { MemberMenu } from './pages/MemberMenu'
import { MemberProfile } from './pages/MemberProfile'
import { useOrg } from './context/OrgContext'
import { usePunchHeader } from './context/PunchHeaderContext'
import {
  applyOrgDefaultLocale,
  SUPPORTED_LANGS,
  type AppLang,
  setLanguageOverride,
} from './i18n'
import { cardShell } from './lib/uiClasses'
import { apiUrl } from './lib/apiBase'

type PublicConfig = {
  organizationSlug: string
  synagogueName: string
  rabbiBanner: string | null
  defaultLocale: string
  timezone: string
}

function OrgPicker() {
  const { t } = useTranslation()
  const { organizations, setOrganizationSlug } = useOrg()

  return (
    <div className="space-y-6 px-1 py-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t('org.chooseTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t('org.chooseHint')}
        </p>
      </div>
      <div className="space-y-3">
        {organizations.map((o) => (
          <button
            key={o.slug}
            type="button"
            onClick={() => setOrganizationSlug(o.slug)}
            className={`${cardShell} w-full text-left transition hover:border-blue-200 hover:shadow-md`}
          >
            <div className="font-semibold text-slate-900">{o.synagogueName}</div>
            <div className="mt-1 text-xs text-slate-500">
              {o.kind === 'SYNAGOGUE'
                ? t('org.kindSynagogue')
                : t('org.kindStudyHall')}{' '}
              · {o.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()
  const { organizationSlug, organizations, loading, deployBanner } = useOrg()
  const { punchInHeaderTitle } = usePunchHeader()
  const [pub, setPub] = useState<PublicConfig | null>(null)
  const isRtl = i18n.language === 'he'

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language === 'he' ? 'he' : 'en'
  }, [isRtl, i18n.language])

  useEffect(() => {
    if (!organizationSlug) {
      setPub(null)
      return
    }
    let cancelled = false
    const q = new URLSearchParams({ organizationSlug })
    fetch(apiUrl(`/api/public/config?${q.toString()}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((j: PublicConfig | null) => {
        if (!cancelled && j) {
          setPub(j)
          applyOrgDefaultLocale(j.defaultLocale)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [organizationSlug])

  if (loading) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-[#f3f4f6] text-slate-600">
        …
      </div>
    )
  }

  if (!organizationSlug || organizations.length === 0) {
    return (
      <BrowserRouter>
        <div
          className="flex w-full flex-1 min-h-0 flex-col overflow-hidden bg-[#f3f4f6] text-slate-900"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="shrink-0 bg-white pt-[env(safe-area-inset-top,0px)]">
            {deployBanner && (
              <div
                role="status"
                className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950 sm:px-4"
              >
                {deployBanner === 'missingVite'
                  ? t('app.deployMissingApiBase')
                  : t('app.deployBadResponse')}
              </div>
            )}
            <header className="border-b border-slate-200/80 px-3 py-3 shadow-sm sm:px-4">
              <div className="mx-auto flex max-w-md min-w-0 items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <span className="block text-lg font-bold tracking-tight text-blue-600">
                    {t('app.title')}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                    {t('app.subtitle')}
                  </span>
                </div>
                <LangToggle />
              </div>
            </header>
          </div>
          <main className="app-scroll-main mx-auto w-full max-w-md min-w-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-6 sm:px-4">
            {organizations.length === 0 ? (
              deployBanner ? null : (
                <p className="text-center text-sm text-slate-600">
                  No locations configured. Run{' '}
                  <code className="rounded bg-slate-100 px-1">npm run db:seed</code>{' '}
                  in the API folder after{' '}
                  <code className="rounded bg-slate-100 px-1">npm run db:push</code>.
                </p>
              )
            ) : (
              <OrgPicker />
            )}
          </main>
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div
        className="flex w-full flex-1 min-h-0 flex-col overflow-hidden bg-[#f3f4f6] text-slate-900"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="shrink-0 bg-white pt-[env(safe-area-inset-top,0px)]">
          {deployBanner && (
            <div
              role="status"
              className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950 sm:px-4"
            >
              {deployBanner === 'missingVite'
                ? t('app.deployMissingApiBase')
                : t('app.deployBadResponse')}
            </div>
          )}
          <header className="border-b border-slate-200/80 px-3 py-3 shadow-sm sm:px-4">
            <div className="mx-auto flex max-w-md min-w-0 items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <Link
                  to="/"
                  className="block truncate text-lg font-bold tracking-tight text-blue-600"
                >
                  {punchInHeaderTitle ?? t('app.title')}
                </Link>
                <span className="shrink-0 text-[11px] font-medium text-slate-500 sm:text-xs">
                  {t('app.subtitle')}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LangToggle />
                <ClockBar />
              </div>
            </div>
          </header>
        </div>
        <RabbiBanner text={pub?.rabbiBanner} />
        <main className="app-scroll-main mx-auto w-full max-w-md min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 text-sm sm:px-4 sm:py-5 sm:text-[15px] pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))]">
          <Routes>
            <Route path="/" element={<Navigate to="/punch" replace />} />
            <Route path="/punch" element={<PunchMenu />} />
            <Route path="/punch/in" element={<PunchIn />} />
            <Route path="/punch/out" element={<PunchOut />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/change-password"
              element={<AdminChangePassword />}
            />
            <Route path="/admin/app" element={<AdminDashboard />} />
            <Route path="/rabbi" element={<RabbiLogin />} />
            <Route path="/rabbi/app" element={<RabbiDashboard />} />
            <Route path="/member" element={<MemberMenu />} />
            <Route path="/member/login" element={<MemberLogin />} />
            <Route path="/member/signup" element={<MemberSignup />} />
            <Route path="/member/app" element={<MemberDashboard />} />
            <Route path="/member/profile" element={<MemberProfile />} />
            <Route path="/member/billing" element={<MemberBilling />} />
            <Route path="*" element={<Navigate to="/punch" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  )
}

function LangToggle() {
  const { i18n, t } = useTranslation()
  const current = SUPPORTED_LANGS.includes(i18n.language as AppLang)
    ? (i18n.language as AppLang)
    : 'en'
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-slate-600"
    >
      <span className="sr-only">{t('lang.label')}</span>
      <select
        aria-label={t('lang.label')}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
        value={current}
        onChange={(e) => setLanguageOverride(e.target.value as AppLang)}
      >
        {SUPPORTED_LANGS.map((lng) => (
          <option key={lng} value={lng}>
            {t(`lang.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  )
}

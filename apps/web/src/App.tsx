import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ClockBar } from './components/ClockBar'
import { MobileNav } from './components/MobileNav'
import { RabbiBanner } from './components/RabbiBanner'
import { Home } from './pages/Home'
import { PunchIn } from './pages/PunchIn'
import { PunchOut } from './pages/PunchOut'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { MemberLogin } from './pages/MemberLogin'
import { MemberDashboard } from './pages/MemberDashboard'
import { MemberSignup } from './pages/MemberSignup'
import { MemberBilling } from './pages/MemberBilling'

type PublicConfig = { synagogueName: string; rabbiBanner: string | null }

export default function App() {
  const [pub, setPub] = useState<PublicConfig | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/public/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: PublicConfig | null) => {
        if (!cancelled && j) setPub(j)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col bg-[#f3f4f6] text-slate-900">
        <header className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-md items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/"
                className="block truncate text-lg font-bold tracking-tight text-blue-600"
              >
                minyan-pays
              </Link>
              <span className="shrink-0 text-[11px] font-medium text-slate-500 sm:text-xs">
                {pub?.synagogueName ?? 'Dovrey Evrit'}
              </span>
            </div>
            <ClockBar />
          </div>
        </header>
        <RabbiBanner text={pub?.rabbiBanner} />
        <main className="mx-auto w-full max-w-md min-h-0 flex-1 overflow-y-auto px-4 py-5 text-sm sm:text-[15px] pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/punch" element={<PunchIn />} />
            <Route path="/punch/out" element={<PunchOut />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/app" element={<AdminDashboard />} />
            <Route path="/member" element={<MemberLogin />} />
            <Route path="/member/signup" element={<MemberSignup />} />
            <Route path="/member/app" element={<MemberDashboard />} />
            <Route path="/member/billing" element={<MemberBilling />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  )
}

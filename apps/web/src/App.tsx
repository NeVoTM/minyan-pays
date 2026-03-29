import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { PunchIn } from './pages/PunchIn'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { MemberLogin } from './pages/MemberLogin'
import { MemberDashboard } from './pages/MemberDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0f1419] text-[#e8eaed]">
        <header className="border-b border-slate-700/80 bg-slate-900/50 px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <Link to="/" className="font-semibold text-amber-200/95">
              minyan-pays
            </Link>
            <span className="text-xs text-slate-500">Dovrey Evrit</span>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/punch" element={<PunchIn />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/app" element={<AdminDashboard />} />
            <Route path="/member" element={<MemberLogin />} />
            <Route path="/member/app" element={<MemberDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

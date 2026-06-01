import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { LoginPage } from './pages/LoginPage'
import { MemberDashboard, TeamDashboard } from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route
        path="/login"
        element={
          <LoginPage
            role="member"
            title="Sign in to Slinkys"
            subtitle="Access your Instant Suite reservations and mobile pass."
            alternate={{ label: 'Managing a team?', href: '/login/team' }}
          />
        }
      />
      <Route
        path="/login/team"
        element={
          <LoginPage
            role="team"
            title="Team admin sign in"
            subtitle="Manage member access, budgets, and billing for Suite Teams."
            alternate={{ label: 'Booking for yourself?', href: '/login' }}
          />
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute role="member">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/app"
        element={
          <ProtectedRoute role="team">
            <TeamDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

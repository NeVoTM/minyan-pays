import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { UserRole } from '../lib/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
  role?: UserRole
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    const loginPath = role === 'team' ? '/login/team' : '/login'
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (role && session.role !== role) {
    const home = session.role === 'team' ? '/team/app' : '/app'
    return <Navigate to={home} replace />
  }

  return children
}

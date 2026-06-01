import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import { loadSession, login as authLogin, logout as authLogout, type UserRole } from '../lib/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => loadSession())

  const login = useCallback((email: string, password: string, role?: UserRole) => {
    const next = authLogin(email, password, role)
    if (!next) return false
    setSession(next)
    return true
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

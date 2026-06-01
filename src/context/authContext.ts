import { createContext } from 'react'
import type { Session, UserRole } from '../lib/auth'

export type AuthContextValue = {
  session: Session | null
  login: (email: string, password: string, role?: UserRole) => boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

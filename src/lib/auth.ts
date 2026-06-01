export type UserRole = 'member' | 'team'

export type Session = {
  email: string
  name: string
  role: UserRole
  token: string
}

const STORAGE_KEY = 'slinkys_session'

/** Demo accounts until backend auth ships. */
const DEMO_USERS: Record<string, { password: string; name: string; role: UserRole }> = {
  'demo@lucloft716.com': { password: 'Luc716!', name: 'Maria Santos', role: 'member' },
  'admin@lucloft716.com': { password: 'Suite716!', name: 'LuxLoft716 Admin', role: 'team' },
}

export function login(email: string, password: string, expectedRole?: UserRole): Session | null {
  const normalized = email.trim().toLowerCase()
  const user = DEMO_USERS[normalized]
  if (!user || user.password !== password) return null
  if (expectedRole && user.role !== expectedRole) return null

  const session: Session = {
    email: normalized,
    name: user.name,
    role: user.role,
    token: btoa(`${normalized}:${Date.now()}`),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function demoHint(role: UserRole) {
  if (role === 'team') {
    return { email: 'admin@lucloft716.com', password: 'Suite716!' }
  }
  return { email: 'demo@lucloft716.com', password: 'Luc716!' }
}

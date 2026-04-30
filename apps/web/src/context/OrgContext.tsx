import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setOrgSlugGetter } from '../lib/orgSlugGetter'
import { apiUrl } from '../lib/apiBase'

const STORAGE_KEY = 'minyan_org_slug'

export type OrganizationRow = {
  slug: string
  name: string
  kind: 'SYNAGOGUE' | 'STUDY_HALL'
  synagogueName: string
  locationAddress?: string | null
  defaultLocale: string
}

type OrgContextValue = {
  organizationSlug: string | null
  setOrganizationSlug: (slug: string | null) => void
  organizations: OrganizationRow[]
  loading: boolean
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organizationSlug, setOrganizationSlugState] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY)
      } catch {
        return null
      }
    }
  )
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [loading, setLoading] = useState(true)

  const setOrganizationSlug = useCallback((slug: string | null) => {
    try {
      if (slug) localStorage.setItem(STORAGE_KEY, slug)
      else localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('minyan_member_token')
      localStorage.removeItem('minyan_admin_token')
    } catch {
      /* ignore */
    }
    setOrganizationSlugState(slug)
  }, [])

  useEffect(() => {
    setOrgSlugGetter(() => organizationSlug)
  }, [organizationSlug])

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/public/organizations'))
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: OrganizationRow[]) => {
        if (cancelled) return
        const nextRows = Array.isArray(rows) ? rows : []
        setOrganizations(nextRows)
        setOrganizationSlugState((prev) => {
          if (prev && nextRows.some((r) => r.slug === prev)) return prev
          if (nextRows.length === 1) {
            const single = nextRows[0].slug
            try {
              localStorage.setItem(STORAGE_KEY, single)
            } catch {
              /* ignore */
            }
            return single
          }
          try {
            localStorage.removeItem(STORAGE_KEY)
          } catch {
            /* ignore */
          }
          return null
        })
      })
      .catch(() => {
        if (!cancelled) setOrganizations([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      organizationSlug,
      setOrganizationSlug,
      organizations,
      loading,
    }),
    [organizationSlug, setOrganizationSlug, organizations, loading]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within OrgProvider')
  return ctx
}

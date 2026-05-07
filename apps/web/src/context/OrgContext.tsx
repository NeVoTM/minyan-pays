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
import { apiUrl, isMissingProductionApiBase } from '../lib/apiBase'

const STORAGE_KEY = 'minyan_org_slug'

export type OrganizationRow = {
  slug: string
  name: string
  kind: 'SYNAGOGUE' | 'STUDY_HALL'
  synagogueName: string
  locationAddress?: string | null
  defaultLocale: string
  checkInLatitude?: number | null
  checkInLongitude?: number | null
}

export type OrgDeployBanner = 'missingVite' | 'badResponse' | null

type OrgContextValue = {
  organizationSlug: string | null
  setOrganizationSlug: (slug: string | null) => void
  organizations: OrganizationRow[]
  loading: boolean
  refreshOrganizations: () => Promise<void>
  deployBanner: OrgDeployBanner
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
  const [deployBanner, setDeployBanner] = useState<OrgDeployBanner>(null)

  const setOrganizationSlug = useCallback((slug: string | null) => {
    try {
      if (slug) localStorage.setItem(STORAGE_KEY, slug)
      else localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('minyan_member_token')
      localStorage.removeItem('minyan_admin_token')
      localStorage.removeItem('minyan_rabbi_token')
    } catch {
      /* ignore */
    }
    setOrganizationSlugState(slug)
  }, [])

  useEffect(() => {
    setOrgSlugGetter(() => organizationSlug)
  }, [organizationSlug])

  const refreshOrganizations = useCallback(async () => {
    if (isMissingProductionApiBase()) {
      setDeployBanner('missingVite')
      setOrganizations([])
      setLoading(false)
      return
    }
    setDeployBanner(null)
    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/public/organizations'))
      const text = await r.text()
      const looksHtml = text.trimStart().startsWith('<')
      let parsed: unknown = null
      if (r.ok && !looksHtml && text.trim()) {
        try {
          parsed = JSON.parse(text) as unknown
        } catch {
          parsed = null
        }
      }
      if (!r.ok || looksHtml || !Array.isArray(parsed)) {
        setDeployBanner('badResponse')
        setOrganizations([])
        setLoading(false)
        return
      }
      const nextRows = parsed as OrganizationRow[]
      setOrganizations(nextRows)
      setOrganizationSlugState((prev) => {
        if (prev && nextRows.some((row) => row.slug === prev)) return prev
        if (nextRows.length === 1) {
          const single = nextRows[0]!.slug
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
    } catch {
      setDeployBanner('badResponse')
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshOrganizations()
  }, [refreshOrganizations])

  const value = useMemo(
    () => ({
      organizationSlug,
      setOrganizationSlug,
      organizations,
      loading,
      refreshOrganizations,
      deployBanner,
    }),
    [
      organizationSlug,
      setOrganizationSlug,
      organizations,
      loading,
      refreshOrganizations,
      deployBanner,
    ]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within OrgProvider')
  return ctx
}

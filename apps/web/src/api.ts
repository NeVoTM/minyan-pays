import { getOrgSlugForApi } from './lib/orgSlugGetter'
import { apiUrl } from './lib/apiBase'

const API_HINT =
  'Start the servers: double-click "Start minyan-pays dev.bat" on the Desktop, or run "cd C:\\Users\\17274\\minyan-pays" then "npm run dev" (needs API on port 3001 and web on 5173).'

function pickErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const p = payload as {
    error?: unknown
    formErrors?: unknown[]
    fieldErrors?: Record<string, unknown>
  }
  if (typeof p.error === 'string' && p.error.trim()) return p.error
  if (p.error && typeof p.error === 'object') {
    const e = p.error as {
      formErrors?: unknown[]
      fieldErrors?: Record<string, unknown>
    }
    const top = e.formErrors?.find((v) => typeof v === 'string' && v.trim())
    if (typeof top === 'string') return top
    if (e.fieldErrors && typeof e.fieldErrors === 'object') {
      for (const v of Object.values(e.fieldErrors)) {
        if (Array.isArray(v)) {
          const first = v.find((x) => typeof x === 'string' && x.trim())
          if (typeof first === 'string') return first
        }
      }
    }
  }
  if (Array.isArray(p.formErrors)) {
    const first = p.formErrors.find((v) => typeof v === 'string' && v.trim())
    if (typeof first === 'string') return first
  }
  return fallback
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; orgSlug?: string | null } = {}
): Promise<T> {
  const { token, orgSlug, headers, ...rest } = options
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json')
  if (token) h.set('Authorization', `Bearer ${token}`)
  const effectiveOrgSlug =
    orgSlug !== undefined ? orgSlug : getOrgSlugForApi()
  if (effectiveOrgSlug) h.set('X-Organization-Slug', effectiveOrgSlug)
  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...rest, headers: h })
  } catch {
    throw new Error(`Cannot reach the server. ${API_HINT}`)
  }
  const text = await res.text()
  if (!res.ok) {
    if (res.status === 502 || res.status === 503) {
      throw new Error(`Service unavailable (${res.status}). ${API_HINT}`)
    }
    let msg = text
    try {
      const j = JSON.parse(text) as unknown
      msg = pickErrorMessage(j, msg)
    } catch {
      /* raw */
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function fetchBlob(
  path: string,
  options: { token?: string | null } = {}
): Promise<Blob> {
  const h = new Headers()
  if (options.token) h.set('Authorization', `Bearer ${options.token}`)
  const orgSlug = getOrgSlugForApi()
  if (orgSlug) h.set('X-Organization-Slug', orgSlug)
  let res: Response
  try {
    res = await fetch(apiUrl(path), { headers: h })
  } catch {
    throw new Error(`Cannot reach the server. ${API_HINT}`)
  }
  if (!res.ok) {
    if (res.status === 502 || res.status === 503) {
      throw new Error(`Service unavailable (${res.status}). ${API_HINT}`)
    }
    const text = await res.text()
    let msg = text
    try {
      const j = JSON.parse(text) as unknown
      msg = pickErrorMessage(j, msg)
    } catch {
      /* raw */
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.blob()
}

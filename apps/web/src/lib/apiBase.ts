/**
 * Production static hosting has no Vite proxy — set `VITE_API_BASE_URL` to the API origin
 * (e.g. `https://minyan-pays.onrender.com`). Omit for local dev; `/api` is proxied to port 3001.
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
  if (!base) return path.startsWith('/') ? path : `/${path}`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${normalized}`
}

/** True when the static build has no API origin — same-origin /api will not reach the API. */
export function isMissingProductionApiBase(): boolean {
  return Boolean(import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL?.trim())
}

/**
 * Production static hosting has no Vite proxy — set `VITE_API_BASE_URL` to the API origin
 * (e.g. `https://minyan-pays-api.onrender.com`). Omit for local dev; `/api` is proxied to port 3001.
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
  if (!base) return path.startsWith('/') ? path : `/${path}`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${normalized}`
}

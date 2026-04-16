const API_HINT =
  'Start the servers: double-click "Start minyan-pays dev.bat" on the Desktop, or run "cd C:\\Users\\17274\\minyan-pays" then "npm run dev" (needs API on port 3001 and web on 5173).'

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json')
  if (token) h.set('Authorization', `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(path, { ...rest, headers: h })
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
      const j = JSON.parse(text) as { error?: unknown }
      if (j.error != null) {
        msg =
          typeof j.error === 'string' ? j.error : JSON.stringify(j.error)
      }
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
  let res: Response
  try {
    res = await fetch(path, { headers: h })
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
      const j = JSON.parse(text) as { error?: unknown }
      if (j.error && typeof j.error === 'string') msg = j.error
    } catch {
      /* raw */
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.blob()
}

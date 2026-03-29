export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json')
  if (token) h.set('Authorization', `Bearer ${token}`)
  const res = await fetch(path, { ...rest, headers: h })
  const text = await res.text()
  if (!res.ok) {
    let msg = text
    try {
      const j = JSON.parse(text) as { error?: string }
      if (j.error) msg = j.error
    } catch {
      /* raw */
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

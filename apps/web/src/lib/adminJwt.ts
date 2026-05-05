/** Read JWT payload claim without verifying signature (UX only). */
export function adminTokenMustChangePassword(token: string | null): boolean {
  if (!token?.includes('.')) return false
  try {
    const part = token.split('.')[1]!
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const payload = JSON.parse(atob(b64 + pad)) as {
      adminMustChangePassword?: boolean
    }
    return payload.adminMustChangePassword === true
  } catch {
    return false
  }
}

/**
 * ADMIN_PASSWORD for admin login when Organization.adminPasswordHash is null.
 * Strips whitespace and optional surrounding quotes (common when copying from env UIs).
 */
export function getEnvAdminPassword(): string | undefined {
  const raw = process.env.ADMIN_PASSWORD;
  if (raw == null) return undefined;
  let s = raw.trim();
  if (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

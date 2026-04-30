/**
 * Normalize admin password from env or login body so comparisons match after
 * copy/paste (BOM, nested quotes from some hosting UIs, trim).
 */
export function normalizeAdminPasswordInput(raw: string): string {
  let s = raw.trim().replace(/^\uFEFF/, "").trim();
  while (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))
  ) {
    s = s.slice(1, -1).trim().replace(/^\uFEFF/, "").trim();
  }
  return s;
}

/**
 * ADMIN_PASSWORD for /api/auth/admin.
 */
export function getEnvAdminPassword(): string | undefined {
  const raw = process.env.ADMIN_PASSWORD;
  if (raw == null) return undefined;
  const s = normalizeAdminPasswordInput(raw);
  return s || undefined;
}

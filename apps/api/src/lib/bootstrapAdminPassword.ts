/**
 * Until `Organization.adminPasswordHash` is set, admin may log in with this
 * one-time bootstrap secret only. Override in production via env if needed.
 *
 * Priority: ADMIN_BOOTSTRAP_PASSWORD → ADMIN_PASSWORD → built-in default.
 */
const DEFAULT_BOOTSTRAP_ADMIN_PASSWORD = "11213Aron";

export function getBootstrapAdminPlaintext(): string {
  const fromEnv =
    process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();
  return fromEnv || DEFAULT_BOOTSTRAP_ADMIN_PASSWORD;
}

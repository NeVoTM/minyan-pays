# Security Route Audit (May 2026)

Purpose: launch sign-off artifact for API route protection and org-isolation checks.

## 1) Route protection inventory

| Route group | Base path | Auth middleware | Role gate | Notes |
|---|---|---|---|---|
| Health | `/api/health` | None | None | Public liveness endpoint by design. |
| Public | `/api/public/*` | None | None | Public config/org/ZIP helpers by design. |
| Auth | `/api/auth/*` | None | None | Login endpoints validate credentials before token issuance. |
| Register | `/api/register` | None | None | Public signup flow by design; creates unapproved members. |
| Punch (public) | `/api/punch/in`, `/api/punch/out-public`, `/api/punch/out-location-default` | None | None | Public kiosk flows by design; now require phone + PIN verification. |
| Punch (member session) | `/api/punch/out` | `authMiddleware` | `requireApprovedMember` | Protected member punch-out path. |
| Admin | `/api/admin/*` | `authMiddleware` | `requireAdmin` | Global admin capabilities; password-change gate enforces bootstrap rotation. |
| Rabbi | `/api/rabbi/*` | `authMiddleware` | `requireRabbi` | Rabbi-only approvals/settings/reports routes. |
| Member self | `/api/me/*` | `authMiddleware` | `requireApprovedMember` | Member-only profile/balance/donation/cashout routes. |

## 2) Credential checks (token issuance)

| Endpoint | Credential requirement | Result on failure |
|---|---|---|
| `POST /api/auth/admin` | Admin password: org hash or bootstrap fallback | `401` |
| `POST /api/auth/rabbi` | Rabbi hash or env fallback | `401` |
| `POST /api/auth/member` | Member phone + PIN (`bcrypt`) | `401` |

Validated behavior: bad admin password and bad member PIN return `401`.

## 3) Cross-tenant isolation review

### Enforced/scoped paths

- Admin member/rabbi/attendance/treasury/settings/report operations are scoped by token org id or by org-bound related records.
- Rabbi routes consistently scope member/session/attendance/payout/treasury operations by token org id.
- Member self routes validate both JWT org id and user organization for profile-sensitive paths.
- Registration is slug-scoped to the target organization; member uniqueness checks are org-scoped.

### Explicit exceptions (intentional or product policy)

1. `GET /api/admin/organizations` returns all organizations (not token-org scoped).
2. `POST /api/admin/organizations` creates new organizations globally.

These two endpoints imply a central-admin model rather than strict per-org admin isolation.
If this is not intended for Crown Heights launch, restrict these endpoints to a super-admin claim or a dedicated allowlist.

## 4) Follow-up recommendations

1. Keep current public punch endpoints public, but maintain phone + PIN verification as mandatory.
2. Decide and document admin tenancy model explicitly:
   - **Central admin model:** keep global org routes as-is and document rationale.
   - **Strict per-org model:** scope or remove global org CRUD/list for regular admin tokens.
3. Keep startup env guards (`DATABASE_URL`, `JWT_SECRET`) enabled in non-test environments.

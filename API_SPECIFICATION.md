# API specification (minyan-pays)

**Route map and auth model:** [docs/PROGRAMMER_HANDOFF.md](./docs/PROGRAMMER_HANDOFF.md) section *HTTP API surface*.

**Implementation:** Express routers under `apps/api/src/routes/`:

- `public.ts` → `/api/public`
- `auth.ts` → `/api/auth`
- `register.ts` → `/api/register`
- `punch.ts` → `/api/punch`
- `member.ts` → `/api/me`
- `rabbi.ts` → `/api/rabbi`
- `admin.ts` → `/api/admin`

**Health:** `GET /api/health`

There is **no** maintained OpenAPI/Swagger file; request/response bodies are defined in route handlers and Zod schemas in the same files (and related `lib` modules).

---

*The previous version of this file described fictional endpoints (`/api/payments/create`, etc.) that are not part of this codebase.*

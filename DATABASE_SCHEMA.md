# Database schema (minyan-pays)

**Authoritative source:** `apps/api/prisma/schema.prisma` (PostgreSQL).

**Human-readable overview:** [docs/PROGRAMMER_HANDOFF.md](./docs/PROGRAMMER_HANDOFF.md) section *Database schema*.

## Quick model list

- `Organization` — tenant / location (slug, financial settings, `checkInOnlyPreferred`, banner text, etc.)
- `User` — members (`pinHash`, `attendanceCode`, payout fields, `preferredForCheckIn`, `isApproved`)
- `Rabbi` — rabbi directory rows per org
- `MinyanSession`, `Attendance` — daily sessions and punch records (`PunchStatus`)
- `Treasury` — balance and lock
- `WeeklyPayout` — weekly amounts per user/week
- `Charity`, `MemberLedgerEntry`, `CashoutRequest`, `MemberChangeCode`, `ZipCache`

Run `npx prisma studio` from `apps/api` to browse data locally.

---

*The previous version of this file listed generic `users` / `payments` tables and did not match Prisma.*

import { Router, type Request } from "express";
import type { Organization, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { todayDateKeyInZone } from "../lib/dates.js";
import {
  getOrganizationSettings,
  getTreasuryForOrg,
} from "../lib/earnings.js";
import { fullName } from "../lib/memberDisplay.js";
import { normalizePhone } from "../lib/phone.js";
import {
  authMiddleware,
  requireApprovedMember,
  type JwtPayload,
} from "../middleware/auth.js";
import {
  getOrganizationBySlug,
  getOrgSlugFromRequest,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const punchRouter = Router();

type ResolveMemberResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

const punchIdentityBody = z
  .object({
    phone: z.string().optional(),
    pin: z.string().optional(),
    /** When the same phone+PIN exists at multiple orgs, this disambiguates. */
    organizationSlug: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const phoneOk = (d.phone?.replace(/\D/g, "").length ?? 0) >= 10;
    const pinOk = (d.pin?.trim().length ?? 0) >= 4;
    if (!phoneOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number.",
      });
    }
    if (!pinOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your PIN.",
      });
    }
  });

const punchOutBody = z
  .object({
    phone: z.string().optional(),
    pin: z.string().optional(),
    organizationSlug: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const phoneOk = (d.phone?.replace(/\D/g, "").length ?? 0) >= 10;
    const pinOk = (d.pin?.trim().length ?? 0) >= 4;
    if (!phoneOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number.",
      });
    }
    if (!pinOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your PIN.",
      });
    }
  });

async function resolveVerifiedMemberAnyOrganization(
  phone: string,
  pinRaw?: string
): Promise<ResolveMemberResult[]> {
  const pin = pinRaw?.trim();
  if (!pin) {
    return [{ ok: false, status: 401, error: "Invalid PIN" }];
  }
  const users = await prisma.user.findMany({
    where: { phone, role: "MEMBER", isApproved: true },
  });
  const checks = await Promise.all(
    users.map(async (user) => {
      const ok = user.pinHash ? await bcrypt.compare(pin, user.pinHash) : false;
      return ok ? ({ ok: true as const, user } as ResolveMemberResult) : null;
    })
  );
  return checks.filter((row): row is ResolveMemberResult => row !== null);
}

async function findLatestOpenAttendanceForUsers(userIds: string[]) {
  if (userIds.length === 0) return null;
  return prisma.attendance.findFirst({
    where: {
      userId: { in: userIds },
      punchOutAt: null,
    },
    include: {
      session: {
        include: {
          organization: {
            select: {
              id: true,
              slug: true,
              synagogueName: true,
              locationAddress: true,
            },
          },
        },
      },
    },
    orderBy: [{ punchInAt: "desc" }],
  });
}

type MemberWithOrgSlug = User & { organization: Pick<Organization, "slug"> };

async function resolveApprovedMembersByPhoneAndPin(
  phone: string,
  pinRaw: string
): Promise<MemberWithOrgSlug[]> {
  const pin = pinRaw.trim();
  const users = await prisma.user.findMany({
    where: { phone, role: "MEMBER", isApproved: true },
    include: { organization: { select: { slug: true } } },
  });
  const out: MemberWithOrgSlug[] = [];
  for (const u of users) {
    if (!u.pinHash) continue;
    if (await bcrypt.compare(pin, u.pinHash)) {
      out.push(u);
    }
  }
  return out;
}

function pickMemberFromMatches(
  matched: MemberWithOrgSlug[],
  preferredSlug: string | null
): ResolveMemberResult {
  if (matched.length === 0) {
    return {
      ok: false,
      status: 401,
      error:
        "No member found with this phone and PIN. Check your number or sign in under Member.",
    };
  }
  if (matched.length === 1) {
    return { ok: true, user: matched[0]! };
  }
  if (!preferredSlug) {
    return {
      ok: false,
      status: 400,
      error:
        "This phone is registered at more than one location. Pick your location in the list, then try again.",
    };
  }
  const narrowed = matched.filter((u) => u.organization.slug === preferredSlug);
  if (narrowed.length !== 1) {
    return {
      ok: false,
      status: 401,
      error:
        "No registration matches this phone and PIN for the selected location.",
    };
  }
  return { ok: true, user: narrowed[0]! };
}

async function assertNoBlockingOpenAttendance(
  selected: User,
  matched: MemberWithOrgSlug[]
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const ids = matched.map((m) => m.id);
  const open = await prisma.attendance.findFirst({
    where: {
      userId: { in: ids },
      punchOutAt: null,
    },
    include: {
      session: {
        include: {
          organization: { select: { synagogueName: true } },
        },
      },
    },
  });
  if (!open) return { ok: true };
  if (open.userId !== selected.id) {
    return {
      ok: false,
      status: 409,
      error: `This phone already has an active check-in at ${open.session.organization.synagogueName}. Punch out there before checking in at another site.`,
    };
  }
  return {
    ok: false,
    status: 409,
    error:
      "You already have an open check-in. Punch out or ask the rabbi to close it before checking in again.",
  };
}

punchRouter.post("/in", async (req, res) => {
  const parsed = punchIdentityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const phone = normalizePhone(parsed.data.phone!);
  const pin = parsed.data.pin!;
  const preferredSlug =
    normalizeOrgSlug(parsed.data.organizationSlug) ??
    getOrgSlugFromRequest(req);

  const matched = await resolveApprovedMembersByPhoneAndPin(phone, pin);
  const picked = pickMemberFromMatches(matched, preferredSlug);
  if (!picked.ok) {
    res.status(picked.status).json({ error: picked.error });
    return;
  }
  const user = picked.user;

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!org) {
    res.status(404).json({ error: "Organization not found." });
    return;
  }

  const block = await assertNoBlockingOpenAttendance(user, matched);
  if (!block.ok) {
    res.status(block.status).json({ error: block.error });
    return;
  }

  const treasury = await getTreasuryForOrg(org.id);
  const settings = await getOrganizationSettings(org.id);
  if (treasury.systemLocked) {
    res.status(423).json({
      error: "System locked — treasury or policy. See rabbi.",
    });
    return;
  }
  if (treasury.balanceCents < settings.minReserveCents) {
    res.status(423).json({
      error: "Insufficient treasury reserve — check-ins paused.",
    });
    return;
  }

  const orgPolicy = await prisma.organization.findUnique({
    where: { id: org.id },
    select: { checkInOnlyPreferred: true },
  });
  if (orgPolicy?.checkInOnlyPreferred && !user.preferredForCheckIn) {
    res.status(403).json({
      error:
        "This location only accepts check-ins from preferred members. Ask the rabbi to add you to the preferred list.",
    });
    return;
  }

  const dateKey = todayDateKeyInZone(org.timezone);
  let session = await prisma.minyanSession.findUnique({
    where: {
      organizationId_dateKey: { organizationId: org.id, dateKey },
    },
  });
  if (!session) {
    session = await prisma.minyanSession.create({
      data: { organizationId: org.id, dateKey, status: "OPEN" },
    });
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_sessionId: { userId: user.id, sessionId: session.id },
    },
  });
  if (existing) {
    res.status(409).json({
      error: "Already punched in today",
      attendanceId: existing.id,
      status: existing.punchInStatus,
    });
    return;
  }

  const attendance = await prisma.attendance.create({
    data: {
      sessionId: session.id,
      userId: user.id,
      punchInAt: new Date(),
      punchInStatus: "PENDING",
    },
  });

  res.status(201).json({
    attendanceId: attendance.id,
    displayName: fullName(user.firstName, user.lastName),
    punchInAt: attendance.punchInAt.toISOString(),
    punchInStatus: attendance.punchInStatus,
    organizationSlug: org.slug,
    synagogueName: org.synagogueName,
  });
});

punchRouter.post("/out-location-default", async (req, res) => {
  const bodySchema = z.object({
    phone: z.string(),
    pin: z.string().optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);
  const matches = await resolveVerifiedMemberAnyOrganization(phone, parsed.data.pin);
  const matchedUsers = matches.flatMap((m) => (m.ok ? [m.user] : []));
  const openAttendance = await findLatestOpenAttendanceForUsers(
    matchedUsers.map((u) => u.id)
  );
  if (!openAttendance?.session.organization) {
    res.status(404).json({
      error: "No active check-in found to link for check-out.",
    });
    return;
  }
  const org = openAttendance.session.organization;
  res.json({
    organizationSlug: org.slug,
    synagogueName: org.synagogueName,
    locationAddress: org.locationAddress ?? null,
    attendanceId: openAttendance.id,
  });
});

punchRouter.post("/out-public", async (req, res) => {
  const parsed = punchOutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const phone = normalizePhone(parsed.data.phone ?? "");
  const pin = parsed.data.pin!;
  const preferredSlug =
    normalizeOrgSlug(parsed.data.organizationSlug) ??
    getOrgSlugFromRequest(req);

  const matched = await resolveApprovedMembersByPhoneAndPin(phone, pin);
  const picked = pickMemberFromMatches(matched, preferredSlug);
  if (!picked.ok) {
    res.status(picked.status).json({ error: picked.error });
    return;
  }
  const user = picked.user;

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!org) {
    res.status(404).json({ error: "Organization not found." });
    return;
  }

  const dateKey = todayDateKeyInZone(org.timezone);
  const session = await prisma.minyanSession.findUnique({
    where: {
      organizationId_dateKey: { organizationId: org.id, dateKey },
    },
  });
  if (!session) {
    res.status(404).json({
      error: "No minyan session for today — punch in first.",
    });
    return;
  }

  const att = await prisma.attendance.findUnique({
    where: {
      userId_sessionId: { userId: user.id, sessionId: session.id },
    },
  });
  if (!att) {
    res.status(404).json({ error: "No punch-in found for today." });
    return;
  }
  if (att.punchInStatus !== "CONFIRMED") {
    res.status(400).json({
      error: "Punch-in not confirmed by rabbi yet — cannot log out of minyan.",
    });
    return;
  }
  if (att.punchOutAt) {
    res.status(409).json({
      error: "Already logged out of minyan.",
      punchOutAt: att.punchOutAt.toISOString(),
    });
    return;
  }

  const updated = await prisma.attendance.update({
    where: { id: att.id },
    data: { punchOutAt: new Date() },
  });

  res.json({
    displayName: fullName(user.firstName, user.lastName),
    punchOutAt: updated.punchOutAt!.toISOString(),
  });
});

punchRouter.use(authMiddleware);

punchRouter.post("/out", requireApprovedMember, async (req, res) => {
  const auth = (req as Request & { auth: JwtPayload }).auth;
  const userId = auth.sub;
  const orgId = auth.organizationId;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }

  const dateKey = todayDateKeyInZone(org.timezone);
  const session = await prisma.minyanSession.findUnique({
    where: {
      organizationId_dateKey: { organizationId: orgId, dateKey },
    },
  });
  if (!session) {
    res.status(404).json({ error: "No session today" });
    return;
  }
  const att = await prisma.attendance.findUnique({
    where: { userId_sessionId: { userId, sessionId: session.id } },
  });
  if (!att) {
    res.status(404).json({ error: "No punch-in for today" });
    return;
  }
  if (att.punchInStatus !== "CONFIRMED") {
    res.status(400).json({ error: "Punch-in not confirmed by rabbi yet" });
    return;
  }
  if (att.punchOutAt) {
    res.status(409).json({
      error: "Already punched out",
      punchOutAt: att.punchOutAt.toISOString(),
    });
    return;
  }

  const updated = await prisma.attendance.update({
    where: { id: att.id },
    data: { punchOutAt: new Date() },
  });
  res.json({ punchOutAt: updated.punchOutAt!.toISOString() });
});

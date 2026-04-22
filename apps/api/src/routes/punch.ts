import { Router, type Request } from "express";
import type { User } from "@prisma/client";
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
  requireOrganizationFromRequest,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const punchRouter = Router();

type ResolveMemberResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

const pendingMsg =
  "This account is pending rabbi approval. You cannot use punch until approved.";

async function resolveVerifiedMember(
  organizationId: string,
  phone: string,
  pin: string
): Promise<ResolveMemberResult> {
  const user = await prisma.user.findFirst({
    where: { phone, role: "MEMBER", organizationId },
  });
  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid phone or PIN.",
    };
  }
  const pinOk = await bcrypt.compare(pin, user.pinHash);
  if (!pinOk) {
    return {
      ok: false,
      status: 401,
      error: "Invalid phone or PIN.",
    };
  }
  if (!user.isApproved) {
    return { ok: false, status: 403, error: pendingMsg };
  }
  return { ok: true, user };
}

const punchIdentityBody = z
  .object({
    phone: z.string().optional(),
    pin: z.string().length(4).optional(),
  })
  .superRefine((d, ctx) => {
    const hasPhonePin =
      (d.phone?.replace(/\D/g, "").length ?? 0) >= 10 &&
      (d.pin?.length ?? 0) >= 4;
    const modes = [hasPhonePin].filter(Boolean).length;
    if (modes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use phone + PIN.",
      });
    }
  });

const punchOutBody = z
  .object({
    phone: z.string().optional(),
    pin: z.string().length(4).optional(),
    organizationSlug: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const hasPhonePin =
      (d.phone?.replace(/\D/g, "").length ?? 0) >= 10 &&
      (d.pin?.length ?? 0) >= 4;
    const modes = [hasPhonePin].filter(Boolean).length;
    if (modes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use phone + PIN.",
      });
    }
  });

async function resolveMemberByPunchIdentity(
  orgId: string,
  data: z.infer<typeof punchIdentityBody>
): Promise<ResolveMemberResult> {
  if (data.phone && data.pin) {
    const phone = normalizePhone(data.phone);
    return resolveVerifiedMember(orgId, phone, data.pin);
  }
  return { ok: false, status: 400, error: "Invalid request." };
}

async function resolveVerifiedMemberAnyOrganization(
  phone: string,
  pin: string
): Promise<ResolveMemberResult[]> {
  const users = await prisma.user.findMany({
    where: { phone, role: "MEMBER", isApproved: true },
  });
  const matches: ResolveMemberResult[] = [];
  for (const user of users) {
    const pinOk = await bcrypt.compare(pin, user.pinHash);
    if (pinOk) matches.push({ ok: true, user });
  }
  return matches;
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

punchRouter.post("/in", async (req, res) => {
  const orgRes = await requireOrganizationFromRequest(req);
  if ("error" in orgRes) {
    res.status(orgRes.status).json({ error: orgRes.error });
    return;
  }
  const { org } = orgRes;

  const parsed = punchIdentityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
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

  const resolved = await resolveMemberByPunchIdentity(org.id, parsed.data);
  if (!resolved.ok) {
    res.status(resolved.status).json({ error: resolved.error });
    return;
  }
  const user = resolved.user;

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
  });
});

/** Public punch-out: same identity options as punch-in (code, phone+PIN, smart QR). */
punchRouter.post("/out-location-default", async (req, res) => {
  const bodySchema = z.object({
    phone: z.string(),
    pin: z.string().length(4),
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

  let org = null as Awaited<ReturnType<typeof getOrganizationBySlug>>;
  const bodyOrgSlug = normalizeOrgSlug(parsed.data.organizationSlug);
  if (bodyOrgSlug) {
    org = await getOrganizationBySlug(bodyOrgSlug);
  } else {
    const orgRes = await requireOrganizationFromRequest(req);
    if (!("error" in orgRes)) {
      org = orgRes.org;
    }
  }

  let resolved = null as ResolveMemberResult | null;
  if (org) {
    resolved = await resolveMemberByPunchIdentity(org.id, parsed.data);
    if (!resolved.ok) {
      res.status(resolved.status).json({ error: resolved.error });
      return;
    }
  } else {
    const phone = normalizePhone(parsed.data.phone ?? "");
    const matches = await resolveVerifiedMemberAnyOrganization(
      phone,
      parsed.data.pin ?? ""
    );
    const matchedUsers = matches.flatMap((m) => (m.ok ? [m.user] : []));
    const openAttendance = await findLatestOpenAttendanceForUsers(
      matchedUsers.map((u) => u.id)
    );
    if (!openAttendance?.session.organization) {
      res.status(404).json({ error: "No linked check-in location found." });
      return;
    }
    org = await getOrganizationBySlug(openAttendance.session.organization.slug);
    if (!org) {
      res.status(404).json({ error: "Unknown organization." });
      return;
    }
    resolved = await resolveMemberByPunchIdentity(org.id, parsed.data);
    if (!resolved.ok) {
      res.status(resolved.status).json({ error: resolved.error });
      return;
    }
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
      userId_sessionId: { userId: resolved.user.id, sessionId: session.id },
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
    displayName: fullName(resolved.user.firstName, resolved.user.lastName),
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

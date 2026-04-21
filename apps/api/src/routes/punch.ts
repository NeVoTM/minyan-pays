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
import { decodePunchSmartCode } from "../lib/smartCode.js";
import {
  authMiddleware,
  requireApprovedMember,
  type JwtPayload,
} from "../middleware/auth.js";
import { requireOrganizationFromRequest } from "../lib/organizationService.js";

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
      error: "Invalid phone, PIN, punch-in code, or smart code.",
    };
  }
  const pinOk = await bcrypt.compare(pin, user.pinHash);
  if (!pinOk) {
    return {
      ok: false,
      status: 401,
      error: "Invalid phone, PIN, punch-in code, or smart code.",
    };
  }
  if (!user.isApproved) {
    return { ok: false, status: 403, error: pendingMsg };
  }
  return { ok: true, user };
}

async function resolveMemberByAttendanceCode(
  organizationId: string,
  code: string
): Promise<ResolveMemberResult> {
  const user = await prisma.user.findFirst({
    where: {
      organizationId,
      attendanceCode: code,
      role: "MEMBER",
    },
  });
  if (!user) {
    return {
      ok: false,
      status: 404,
      error: "Invalid phone, PIN, punch-in code, or smart code.",
    };
  }
  if (!user.isApproved) {
    return { ok: false, status: 403, error: pendingMsg };
  }
  return { ok: true, user };
}

const punchIdentityBody = z
  .object({
    attendanceCode: z.string().min(4).max(32).optional(),
    phone: z.string().optional(),
    pin: z.string().min(4).max(12).optional(),
    smartCode: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const hasCode = !!d.attendanceCode?.trim();
    const hasPhonePin =
      (d.phone?.replace(/\D/g, "").length ?? 0) >= 10 &&
      (d.pin?.length ?? 0) >= 4;
    const hasSmart = !!d.smartCode?.trim();
    const modes = [hasCode, hasPhonePin, hasSmart].filter(Boolean).length;
    if (modes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Use exactly one: punch-in code, phone + PIN, or smart code / QR.",
      });
    }
  });

async function resolveMemberByPunchIdentity(
  orgId: string,
  data: z.infer<typeof punchIdentityBody>
): Promise<ResolveMemberResult> {
  if (data.smartCode) {
    const dec = decodePunchSmartCode(data.smartCode);
    if (!dec) {
      return { ok: false, status: 400, error: "Invalid smart code." };
    }
    return resolveVerifiedMember(orgId, dec.phone, dec.pin);
  }
  if (data.phone && data.pin) {
    const phone = normalizePhone(data.phone);
    return resolveVerifiedMember(orgId, phone, data.pin);
  }
  if (data.attendanceCode?.trim()) {
    return resolveMemberByAttendanceCode(orgId, data.attendanceCode.trim());
  }
  return { ok: false, status: 400, error: "Invalid request." };
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
punchRouter.post("/out-public", async (req, res) => {
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

  const resolved = await resolveMemberByPunchIdentity(org.id, parsed.data);
  if (!resolved.ok) {
    res.status(resolved.status).json({ error: resolved.error });
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

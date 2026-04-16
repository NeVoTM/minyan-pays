import { Router, type Request } from "express";
import type { User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { todayDateKey } from "../lib/dates.js";
import { getSettings, getTreasury } from "../lib/earnings.js";
import { fullName } from "../lib/memberDisplay.js";
import { normalizePhone } from "../lib/phone.js";
import {
  authMiddleware,
  requireApprovedMember,
  type JwtPayload,
} from "../middleware/auth.js";

export const punchRouter = Router();

type ResolveMemberResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

async function resolveApprovedMemberByPhoneOrName(
  phoneRaw: string | undefined,
  fullNameRaw: string | undefined
): Promise<ResolveMemberResult> {
  const digits = (phoneRaw ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const phone = normalizePhone(phoneRaw!);
    const user = await prisma.user.findFirst({
      where: { phone, role: "MEMBER" },
    });
    if (!user) {
      return {
        ok: false,
        status: 404,
        error: "No member with that phone number.",
      };
    }
    if (!user.isApproved) {
      return {
        ok: false,
        status: 403,
        error:
          "This account is pending rabbi approval. You cannot log out until approved.",
      };
    }
    return { ok: true, user };
  }

  const raw = (fullNameRaw ?? "").trim().replace(/\s+/g, " ");
  if (raw) {
    const idx = raw.indexOf(" ");
    if (idx === -1) {
      return {
        ok: false,
        status: 400,
        error: "Enter first and last name separated by a space.",
      };
    }
    const first = raw.slice(0, idx).trim();
    const last = raw.slice(idx + 1).trim();
    if (!first || !last) {
      return {
        ok: false,
        status: 400,
        error: "Enter both first and last name.",
      };
    }
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
    });
    const matches = members.filter(
      (m) =>
        m.firstName.trim().toLowerCase() === first.toLowerCase() &&
        m.lastName.trim().toLowerCase() === last.toLowerCase()
    );
    if (matches.length === 0) {
      return {
        ok: false,
        status: 404,
        error: "No member matches that name.",
      };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        status: 409,
        error:
          "Multiple members share that name — use your phone number instead.",
      };
    }
    const user = matches[0]!;
    if (!user.isApproved) {
      return {
        ok: false,
        status: 403,
        error:
          "This account is pending rabbi approval. You cannot log out until approved.",
      };
    }
    return { ok: true, user };
  }

  return {
    ok: false,
    status: 400,
    error: "Enter your 10-digit phone or your first and last name.",
  };
}

const punchOutPublicBody = z
  .object({
    phone: z.string().optional(),
    fullName: z.string().optional(),
  })
  .refine(
    (d) => {
      const digits = (d.phone ?? "").replace(/\D/g, "");
      const name = (d.fullName ?? "").trim();
      return digits.length >= 10 || name.length >= 3;
    },
    { message: "Enter your 10-digit phone or your first and last name." }
  );

const punchInBody = z.object({
  attendanceCode: z.string().min(4).max(32),
});

punchRouter.post("/in", async (req, res) => {
  const parsed = punchInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const treasury = await getTreasury();
  const settings = await getSettings();
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

  const user = await prisma.user.findUnique({
    where: { attendanceCode: parsed.data.attendanceCode.trim() },
  });
  if (!user) {
    res.status(404).json({ error: "Invalid code" });
    return;
  }
  if (!user.isApproved) {
    res.status(403).json({
      error:
        "This account is pending rabbi approval. You cannot punch in until approved.",
    });
    return;
  }

  const dateKey = todayDateKey();
  let session = await prisma.minyanSession.findUnique({
    where: { dateKey },
  });
  if (!session) {
    session = await prisma.minyanSession.create({
      data: { dateKey, status: "OPEN" },
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

/** Public punch-out: identify by phone or "First Last" name; stamps punchOutAt. */
punchRouter.post("/out-public", async (req, res) => {
  const parsed = punchOutPublicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const resolved = await resolveApprovedMemberByPhoneOrName(
    parsed.data.phone,
    parsed.data.fullName
  );
  if (!resolved.ok) {
    res.status(resolved.status).json({ error: resolved.error });
    return;
  }

  const dateKey = todayDateKey();
  const session = await prisma.minyanSession.findUnique({
    where: { dateKey },
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
  const dateKey = todayDateKey();
  const session = await prisma.minyanSession.findUnique({
    where: { dateKey },
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

import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { todayDateKey } from "../lib/dates.js";
import { getSettings, getTreasury } from "../lib/earnings.js";
import {
  authMiddleware,
  requireMember,
  type JwtPayload,
} from "../middleware/auth.js";

export const punchRouter = Router();

const punchInBody = z.object({
  attendanceCode: z.string().min(4).max(32),
});

/** Public: attendee enters their code (pending until rabbi confirms). */
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
    name: user.name,
    punchInAt: attendance.punchInAt.toISOString(),
    punchInStatus: attendance.punchInStatus,
  });
});

punchRouter.use(authMiddleware);

punchRouter.post("/out", requireMember, async (req, res) => {
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

import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import { todayDateKey } from "../lib/dates.js";
import { getSettings, getTreasury } from "../lib/earnings.js";
import { rankFirstNine } from "../lib/earnings.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

adminRouter.get("/session/today", async (_req, res) => {
  const dateKey = todayDateKey();
  let session = await prisma.minyanSession.findUnique({
    where: { dateKey },
    include: {
      attendances: {
        include: { user: true },
        orderBy: { punchInAt: "asc" },
      },
    },
  });
  if (!session) {
    session = await prisma.minyanSession.create({
      data: { dateKey, status: "OPEN" },
      include: {
        attendances: {
          include: { user: true },
          orderBy: { punchInAt: "asc" },
        },
      },
    });
  }
  const settings = await getSettings();
  const firstMap = rankFirstNine(session.attendances, settings.firstNineSlots);
  res.json({
    dateKey,
    sessionId: session.id,
    attendances: session.attendances.map((a) => ({
      id: a.id,
      punchInAt: a.punchInAt.toISOString(),
      punchInStatus: a.punchInStatus,
      punchInConfirmedAt: a.punchInConfirmedAt?.toISOString() ?? null,
      punchOutAt: a.punchOutAt?.toISOString() ?? null,
      wouldBeFirstNine:
        a.punchInStatus === "CONFIRMED" && (firstMap.get(a.userId) ?? false),
      user: {
        id: a.user.id,
        name: a.user.name,
        phone: a.user.phone,
        attendanceCode: a.user.attendanceCode,
      },
    })),
  });
});

const createMember = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  pin: z.string().min(4).max(12),
  attendanceCode: z.string().min(4).max(32),
  isMarried: z.boolean().optional(),
  zellePhone: z.string().optional(),
  wifeZellePhone: z.string().optional(),
  bonusRecipient: z.enum(["SELF", "WIFE"]).optional(),
});

adminRouter.post("/members", async (req, res) => {
  const parsed = createMember.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const phone = normalizePhone(parsed.data.phone);
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        phone,
        pinHash,
        attendanceCode: parsed.data.attendanceCode.trim(),
        isMarried: parsed.data.isMarried ?? false,
        zellePhone: parsed.data.zellePhone?.trim() || null,
        wifeZellePhone: parsed.data.wifeZellePhone?.trim() || null,
        bonusRecipient: parsed.data.bonusRecipient ?? "WIFE",
      },
    });
    res.status(201).json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      attendanceCode: user.attendanceCode,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create failed";
    res.status(409).json({ error: msg });
  }
});

adminRouter.get("/members", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      attendanceCode: true,
      isMarried: true,
      zellePhone: true,
      wifeZellePhone: true,
      bonusRecipient: true,
    },
  });
  res.json(users);
});

adminRouter.post("/attendance/:id/confirm", async (req, res) => {
  const treasury = await getTreasury();
  const settings = await getSettings();
  if (treasury.systemLocked) {
    res.status(423).json({ error: "System locked" });
    return;
  }
  if (treasury.balanceCents < settings.minReserveCents) {
    res.status(423).json({ error: "Insufficient treasury reserve" });
    return;
  }

  const id = req.params.id;
  const att = await prisma.attendance.findUnique({
    where: { id },
    include: { session: { include: { attendances: { include: { user: true } } } } },
  });
  if (!att || att.punchInStatus !== "PENDING") {
    res.status(400).json({ error: "Not pending" });
    return;
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      punchInStatus: "CONFIRMED",
      punchInConfirmedAt: new Date(),
    },
  });
  res.json({
    id: updated.id,
    punchInStatus: updated.punchInStatus,
    punchInConfirmedAt: updated.punchInConfirmedAt!.toISOString(),
  });
});

adminRouter.post("/attendance/:id/reject", async (req, res) => {
  const id = req.params.id;
  const att = await prisma.attendance.findUnique({ where: { id } });
  if (!att || att.punchInStatus !== "PENDING") {
    res.status(400).json({ error: "Not pending" });
    return;
  }
  const updated = await prisma.attendance.update({
    where: { id },
    data: { punchInStatus: "REJECTED" },
  });
  res.json({ id: updated.id, punchInStatus: updated.punchInStatus });
});

adminRouter.patch("/settings", async (req, res) => {
  const schema = z.object({
    synagogueName: z.string().optional(),
    firstNineCents: z.number().int().min(0).optional(),
    weeklyBonusCents: z.number().int().min(0).optional(),
    firstNineSlots: z.number().int().min(1).max(50).optional(),
    minReserveCents: z.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const s = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });
  res.json(s);
});

adminRouter.get("/settings", async (_req, res) => {
  const s = await getSettings();
  res.json(s);
});

adminRouter.post("/treasury/fund", async (req, res) => {
  const schema = z.object({ deltaCents: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const t = await getTreasury();
  const updated = await prisma.treasury.update({
    where: { id: t.id },
    data: { balanceCents: t.balanceCents + parsed.data.deltaCents },
  });
  res.json(updated);
});

adminRouter.patch("/treasury/lock", async (req, res) => {
  const schema = z.object({ systemLocked: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const t = await getTreasury();
  const updated = await prisma.treasury.update({
    where: { id: t.id },
    data: { systemLocked: parsed.data.systemLocked },
  });
  res.json(updated);
});

adminRouter.get("/treasury", async (_req, res) => {
  const t = await getTreasury();
  res.json(t);
});

function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

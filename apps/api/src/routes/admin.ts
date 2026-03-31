import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import { todayDateKey } from "../lib/dates.js";
import {
  computeAllMembersWeekSummary,
  getSettings,
  getTreasury,
  rankFirstNine,
} from "../lib/earnings.js";
import { normalizePhone } from "../lib/phone.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  assertNoMemberDuplicates,
  DuplicateMemberError,
} from "../lib/memberDuplicates.js";
import { memberFieldsSchema, memberUpdateSchema } from "../lib/memberSchemas.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

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
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        displayName: fullName(a.user.firstName, a.user.lastName),
        phone: a.user.phone,
        attendanceCode: a.user.attendanceCode,
      },
    })),
  });
});

adminRouter.post("/members", async (req, res) => {
  const parsed = memberFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  try {
    await assertNoMemberDuplicates(prisma, {
      firstName: d.firstName,
      lastName: d.lastName,
      phone,
      zellePhone: trimOrNull(d.zellePhone ?? undefined),
      wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
    });
  } catch (e: unknown) {
    if (e instanceof DuplicateMemberError) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw e;
  }

  const pinHash = await bcrypt.hash(d.pin, 10);
  try {
    const user = await prisma.user.create({
      data: {
        firstName: d.firstName.trim(),
        lastName: d.lastName.trim(),
        phone,
        pinHash,
        attendanceCode: d.attendanceCode.trim(),
        isMarried: d.isMarried ?? false,
        zellePhone: trimOrNull(d.zellePhone ?? undefined),
        wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
        bonusRecipient: d.bonusRecipient ?? "WIFE",
        addressLine1: trimOrNull(d.addressLine1 ?? undefined),
        addressLine2: trimOrNull(d.addressLine2 ?? undefined),
        city: trimOrNull(d.city ?? undefined),
        stateRegion: trimOrNull(d.stateRegion ?? undefined),
        postalCode: trimOrNull(d.postalCode ?? undefined),
        isApproved: true,
      },
    });
    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: fullName(user.firstName, user.lastName),
      phone: user.phone,
      attendanceCode: user.attendanceCode,
      isApproved: user.isApproved,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create failed";
    res.status(409).json({ error: msg });
  }
});

adminRouter.get("/members", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      attendanceCode: true,
      isMarried: true,
      zellePhone: true,
      wifeZellePhone: true,
      bonusRecipient: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateRegion: true,
      postalCode: true,
      isApproved: true,
      createdAt: true,
    },
  });
  res.json(
    users.map((u) => ({
      ...u,
      displayName: fullName(u.firstName, u.lastName),
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

adminRouter.get("/members/:id", async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, role: "MEMBER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      attendanceCode: true,
      isMarried: true,
      zellePhone: true,
      wifeZellePhone: true,
      bonusRecipient: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateRegion: true,
      postalCode: true,
      isApproved: true,
      createdAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json({
    ...user,
    displayName: fullName(user.firstName, user.lastName),
    createdAt: user.createdAt.toISOString(),
  });
});

adminRouter.patch("/members/:id", async (req, res) => {
  const parsed = memberUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, role: "MEMBER" },
  });
  if (!existing) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const p = parsed.data;
  const firstName = p.firstName ?? existing.firstName;
  const lastName = p.lastName ?? existing.lastName;
  const phone = p.phone ? normalizePhone(p.phone) : existing.phone;
  const zellePhone =
    p.zellePhone !== undefined ? trimOrNull(p.zellePhone) : existing.zellePhone;
  const wifeZellePhone =
    p.wifeZellePhone !== undefined
      ? trimOrNull(p.wifeZellePhone)
      : existing.wifeZellePhone;

  try {
    await assertNoMemberDuplicates(prisma, {
      excludeUserId: existing.id,
      firstName,
      lastName,
      phone,
      zellePhone,
      wifeZellePhone,
    });
  } catch (e: unknown) {
    if (e instanceof DuplicateMemberError) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw e;
  }

  const updateData: Prisma.UserUpdateInput = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone,
    isMarried: p.isMarried ?? existing.isMarried,
    zellePhone,
    wifeZellePhone,
    bonusRecipient: p.bonusRecipient ?? existing.bonusRecipient,
    addressLine1:
      p.addressLine1 !== undefined
        ? trimOrNull(p.addressLine1)
        : existing.addressLine1,
    addressLine2:
      p.addressLine2 !== undefined
        ? trimOrNull(p.addressLine2)
        : existing.addressLine2,
    city: p.city !== undefined ? trimOrNull(p.city) : existing.city,
    stateRegion:
      p.stateRegion !== undefined
        ? trimOrNull(p.stateRegion)
        : existing.stateRegion,
    postalCode:
      p.postalCode !== undefined
        ? trimOrNull(p.postalCode)
        : existing.postalCode,
    isApproved: p.isApproved ?? existing.isApproved,
  };

  if (p.attendanceCode !== undefined) {
    updateData.attendanceCode = p.attendanceCode.trim();
  }
  if (p.pin !== undefined) {
    updateData.pinHash = await bcrypt.hash(p.pin, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
    });
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: fullName(user.firstName, user.lastName),
      phone: user.phone,
      attendanceCode: user.attendanceCode,
      isApproved: user.isApproved,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(409).json({ error: msg });
  }
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
    include: {
      session: { include: { attendances: { include: { user: true } } } },
    },
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

const weekKeyParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD (any day in the week)");

adminRouter.get("/reports/week/:weekKey", async (req, res) => {
  const parsed = weekKeyParam.safeParse(req.params.weekKey);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const summary = await computeAllMembersWeekSummary(parsed.data);
  res.json(summary);
});

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

adminRouter.get("/export/week/:weekKey.csv", async (req, res) => {
  const parsed = weekKeyParam.safeParse(req.params.weekKey);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { weekSundayKey, rows } = await computeAllMembersWeekSummary(
    parsed.data
  );

  const header = [
    "first_name",
    "last_name",
    "phone",
    "week_sunday",
    "daily_first_nine_cents",
    "weekly_bonus_cents",
    "total_cents",
    "bonus_recipient",
    "pay_to_zelle",
    "user_id",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) => {
      const daily = r.breakdown.dailyLines.reduce(
        (s, l) => s + l.amountCents,
        0
      );
      return [
        csvEscape(r.firstName),
        csvEscape(r.lastName),
        csvEscape(r.phone),
        csvEscape(weekSundayKey),
        String(daily),
        String(r.breakdown.weeklyBonusCents),
        String(r.breakdown.totalCents),
        csvEscape(r.bonusRecipient),
        csvEscape(r.suggestedPayoutZelle ?? ""),
        csvEscape(r.userId),
      ].join(",");
    }),
  ];

  const body = lines.join("\r\n") + "\r\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="minyan-payouts-${weekSundayKey}.csv"`
  );
  res.send(body);
});

import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  requireRabbi,
  type JwtPayload,
} from "../middleware/auth.js";
import {
  todayDateKeyInZone,
  weekSundayKeyFromDateKey,
  weekMinyanDateKeys,
} from "../lib/dates.js";
import {
  computeAllMembersWeekSummary,
  getOrganizationSettings,
  getTreasuryForOrg,
  rankFirstNine,
} from "../lib/earnings.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  assertNoMemberDuplicates,
  DuplicateMemberError,
} from "../lib/memberDuplicates.js";
import { rabbiMemberUpdateSchema } from "../lib/memberSchemas.js";
import { normalizeOptionalUsPhone, normalizePhone } from "../lib/phone.js";

export const rabbiRouter = Router();
rabbiRouter.use(authMiddleware);
rabbiRouter.use(requireRabbi);

function orgId(req: Request): string {
  return (req as Request & { auth: JwtPayload }).auth.organizationId;
}

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

const weekKeyParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD (any day in the week)");

function weekReportDateKeys(anyDayInWeek: string, tz: string): string[] {
  const sundayKey = weekSundayKeyFromDateKey(anyDayInWeek, tz);
  return weekMinyanDateKeys(sundayKey, tz);
}

rabbiRouter.get("/settings", async (req, res) => {
  const oid = orgId(req);
  const org = await prisma.organization.findUnique({
    where: { id: oid },
    select: { rabbiBanner: true, checkInOnlyPreferred: true },
  });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  res.json({
    rabbiBanner: org.rabbiBanner ?? "",
    checkInOnlyPreferred: org.checkInOnlyPreferred,
  });
});

const checkInPolicySchema = z.object({
  checkInOnlyPreferred: z.boolean(),
});

rabbiRouter.patch("/settings/check-in-policy", async (req, res) => {
  const oid = orgId(req);
  const parsed = checkInPolicySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = await prisma.organization.update({
    where: { id: oid },
    data: { checkInOnlyPreferred: parsed.data.checkInOnlyPreferred },
    select: { checkInOnlyPreferred: true },
  });
  res.json(updated);
});

/** Approved members — rabbi marks who is preferred for check-in when policy is restricted. */
rabbiRouter.get("/members", async (req, res) => {
  const oid = orgId(req);
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", organizationId: oid, isApproved: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      attendanceCode: true,
      preferredForCheckIn: true,
    },
  });
  res.json(
    users.map((u) => ({
      ...u,
      displayName: fullName(u.firstName, u.lastName),
    }))
  );
});

const preferredBody = z.object({ preferred: z.boolean() });

rabbiRouter.patch("/members/:id/preferred", async (req, res) => {
  const oid = orgId(req);
  const parsed = preferredBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: "MEMBER",
      organizationId: oid,
      isApproved: true,
    },
    select: { id: true },
  });
  if (!user) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { preferredForCheckIn: parsed.data.preferred },
    select: { id: true, preferredForCheckIn: true },
  });
  res.json(updated);
});

/** Single approved member — view/edit from rabbi dashboard. */
rabbiRouter.get("/members/:id", async (req, res) => {
  const oid = orgId(req);
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: "MEMBER",
      organizationId: oid,
      isApproved: true,
    },
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
      city: true,
      stateRegion: true,
      postalCode: true,
      email: true,
      spousePhone: true,
      spouseEmail: true,
      paypalAccount: true,
      achRoutingNumber: true,
      achAccountNumber: true,
      preferredForCheckIn: true,
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

rabbiRouter.patch("/members/:id", async (req, res) => {
  const oid = orgId(req);
  const parsed = rabbiMemberUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: "MEMBER",
      organizationId: oid,
      isApproved: true,
    },
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
      organizationId: oid,
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
    addressLine2: null,
    city: p.city !== undefined ? trimOrNull(p.city) : existing.city,
    stateRegion:
      p.stateRegion !== undefined
        ? trimOrNull(p.stateRegion)
        : existing.stateRegion,
    postalCode:
      p.postalCode !== undefined
        ? trimOrNull(p.postalCode)
        : existing.postalCode,
    email: p.email !== undefined ? p.email : existing.email,
    spousePhone:
      p.spousePhone !== undefined
        ? normalizeOptionalUsPhone(p.spousePhone)
        : existing.spousePhone,
    spouseEmail:
      p.spouseEmail !== undefined ? p.spouseEmail : existing.spouseEmail,
    paypalAccount:
      p.paypalAccount !== undefined
        ? trimOrNull(p.paypalAccount)
        : existing.paypalAccount,
    achRoutingNumber:
      p.achRoutingNumber !== undefined
        ? trimOrNull(p.achRoutingNumber)
        : existing.achRoutingNumber,
    achAccountNumber:
      p.achAccountNumber !== undefined
        ? trimOrNull(p.achAccountNumber)
        : existing.achAccountNumber,
  };

  if (p.attendanceCode !== undefined) {
    const nextCode = p.attendanceCode.trim();
    if (nextCode !== existing.attendanceCode) {
      const taken = await prisma.user.findFirst({
        where: {
          organizationId: oid,
          attendanceCode: nextCode,
          role: "MEMBER",
          NOT: { id: existing.id },
        },
        select: { id: true },
      });
      if (taken) {
        res.status(409).json({
          error:
            "That punch-in code is already assigned to another member. Choose a different code.",
        });
        return;
      }
    }
    updateData.attendanceCode = nextCode;
  }
  if (p.pin !== undefined && p.pin.trim().length >= 4) {
    updateData.pinHash = await bcrypt.hash(p.pin.trim(), 10);
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
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      res.status(409).json({
        error:
          "That punch-in code or phone is already in use. Change the punch-in code or phone.",
      });
      return;
    }
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(409).json({ error: msg });
  }
});

rabbiRouter.get("/session/today", async (req, res) => {
  const oid = orgId(req);
  const org = await prisma.organization.findUnique({ where: { id: oid } });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const dateKey = todayDateKeyInZone(org.timezone);
  let session = await prisma.minyanSession.findUnique({
    where: {
      organizationId_dateKey: { organizationId: oid, dateKey },
    },
    include: {
      attendances: {
        include: { user: true },
        orderBy: { punchInAt: "asc" },
      },
    },
  });
  if (!session) {
    session = await prisma.minyanSession.create({
      data: { organizationId: oid, dateKey, status: "OPEN" },
      include: {
        attendances: {
          include: { user: true },
          orderBy: { punchInAt: "asc" },
        },
      },
    });
  }
  const settings = await getOrganizationSettings(oid);
  const activeAttendances = session.attendances.filter((a) => !a.canceledAt);
  const canceledAttendances = session.attendances.filter((a) => !!a.canceledAt);
  const firstMap = rankFirstNine(activeAttendances, settings.firstNineSlots);
  res.json({
    dateKey,
    timezone: org.timezone,
    sessionId: session.id,
    attendances: activeAttendances.map((a) => ({
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
        addressLine1: a.user.addressLine1,
        city: a.user.city,
        stateRegion: a.user.stateRegion,
        postalCode: a.user.postalCode,
        email: a.user.email,
      },
    })),
    canceledAttendances: canceledAttendances.map((a) => ({
      id: a.id,
      punchInAt: a.punchInAt.toISOString(),
      canceledAt: a.canceledAt?.toISOString() ?? null,
      canceledByRole: a.canceledByRole ?? null,
      canceledReason: a.canceledReason ?? null,
      user: {
        id: a.user.id,
        displayName: fullName(a.user.firstName, a.user.lastName),
        phone: a.user.phone,
      },
    })),
  });
});

rabbiRouter.post("/attendance/:id/confirm", async (req, res) => {
  const oid = orgId(req);
  const treasury = await getTreasuryForOrg(oid);
  const settings = await getOrganizationSettings(oid);
  if (treasury.systemLocked) {
    res.status(423).json({ error: "System locked" });
    return;
  }
  if (treasury.balanceCents < settings.minReserveCents) {
    res.status(423).json({ error: "Insufficient treasury reserve" });
    return;
  }

  const id = req.params.id;
  const att = await prisma.attendance.findFirst({
    where: {
      id,
      session: { organizationId: oid },
    },
    include: {
      session: { include: { attendances: { include: { user: true } } } },
    },
  });
  if (!att || att.canceledAt || att.punchInStatus !== "PENDING") {
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

rabbiRouter.post("/attendance/:id/reject", async (req, res) => {
  const oid = orgId(req);
  const id = req.params.id;
  const att = await prisma.attendance.findFirst({
    where: { id, session: { organizationId: oid } },
  });
  if (!att || att.canceledAt || att.punchInStatus !== "PENDING") {
    res.status(400).json({ error: "Not pending" });
    return;
  }
  const updated = await prisma.attendance.update({
    where: { id },
    data: { punchInStatus: "REJECTED" },
  });
  res.json({ id: updated.id, punchInStatus: updated.punchInStatus });
});

const cancelAttendanceSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

/** Rabbi may cancel a check-in (soft-delete) if member left/changed plans. */
rabbiRouter.post("/attendance/:id/cancel", async (req, res) => {
  const oid = orgId(req);
  const parsed = cancelAttendanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const att = await prisma.attendance.findFirst({
    where: { id: req.params.id, session: { organizationId: oid } },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!att) {
    res.status(404).json({ error: "Attendance not found" });
    return;
  }
  if (att.canceledAt) {
    res.status(409).json({ error: "Already canceled." });
    return;
  }
  const updated = await prisma.attendance.update({
    where: { id: att.id },
    data: {
      canceledAt: new Date(),
      canceledByRole: "RABBI",
      canceledReason: parsed.data.reason || "Canceled by rabbi",
      punchInStatus: "REJECTED",
      punchInConfirmedAt: null,
      punchOutAt: null,
    },
  });
  res.json({
    id: updated.id,
    canceledAt: updated.canceledAt?.toISOString() ?? null,
    canceledByRole: updated.canceledByRole,
    displayName: fullName(att.user.firstName, att.user.lastName),
  });
});

/** Week earnings + paid status (WeeklyPayout.paidAt). */
rabbiRouter.get("/reports/week/:weekKey", async (req, res) => {
  const oid = orgId(req);
  const org = await prisma.organization.findUnique({ where: { id: oid } });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const parsed = weekKeyParam.safeParse(req.params.weekKey);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { weekSundayKey, rows } = await computeAllMembersWeekSummary(
    parsed.data,
    oid,
    org.timezone
  );

  const payouts = await prisma.weeklyPayout.findMany({
    where: {
      weekKey: weekSundayKey,
      user: { organizationId: oid },
    },
    select: { userId: true, paidAt: true, amountCents: true },
  });
  const paidMap = new Map(
    payouts.map((p) => [p.userId, { paidAt: p.paidAt, amountCents: p.amountCents }])
  );

  const dateKeysInWeek = new Set<string>();
  for (const r of rows) {
    for (const line of r.breakdown.dailyLines) {
      if (line.amountCents > 0) dateKeysInWeek.add(line.dateKey);
    }
  }

  const canceledAttendances = await prisma.attendance.findMany({
    where: {
      canceledAt: { not: null },
      session: {
        organizationId: oid,
        dateKey: { in: weekReportDateKeys(parsed.data, org.timezone) },
      },
    },
    select: {
      id: true,
      punchInAt: true,
      canceledAt: true,
      canceledByRole: true,
      canceledReason: true,
      session: { select: { dateKey: true } },
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: [{ canceledAt: "desc" }],
  });

  res.json({
    weekSundayKey,
    dateKeysInWeek: [...dateKeysInWeek].sort(),
    rows: rows.map((r) => {
      const p = paidMap.get(r.userId);
      return {
        ...r,
        paidAt: p?.paidAt?.toISOString() ?? null,
        storedAmountCents: p?.amountCents ?? null,
      };
    }),
    canceledAttendances: canceledAttendances.map((a) => ({
      id: a.id,
      userId: a.user.id,
      displayName: fullName(a.user.firstName, a.user.lastName),
      phone: a.user.phone,
      dateKey: a.session.dateKey,
      punchInAt: a.punchInAt.toISOString(),
      canceledAt: a.canceledAt?.toISOString() ?? null,
      canceledByRole: a.canceledByRole ?? null,
      canceledReason: a.canceledReason ?? null,
    })),
  });
});

const payoutMarkSchema = z.object({
  /** userId -> paid */
  marks: z.record(z.string(), z.boolean()),
});

const treasuryFundSchema = z.object({ deltaCents: z.number().int() });
const treasuryLockSchema = z.object({ systemLocked: z.boolean() });

/** Mark weekly payout rows paid/unpaid (checkboxes). Amounts come from computed earnings. */
rabbiRouter.patch("/reports/week/:weekKey/payouts", async (req, res) => {
  const oid = orgId(req);
  const org = await prisma.organization.findUnique({ where: { id: oid } });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const parsedKey = weekKeyParam.safeParse(req.params.weekKey);
  if (!parsedKey.success) {
    res.status(400).json({ error: parsedKey.error.flatten() });
    return;
  }
  const parsedBody = payoutMarkSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.flatten() });
    return;
  }

  const { weekSundayKey, rows } = await computeAllMembersWeekSummary(
    parsedKey.data,
    oid,
    org.timezone
  );
  const rowByUser = new Map(rows.map((r) => [r.userId, r]));
  const marks = parsedBody.data.marks;

  const ops: any[] = [];
  for (const [uid, paid] of Object.entries(marks)) {
    const row = rowByUser.get(uid);
    if (!row) {
      ops.push(
        prisma.weeklyPayout.deleteMany({
          where: { userId: uid, weekKey: weekSundayKey },
        }),
        prisma.memberLedgerEntry.deleteMany({
          where: { userId: uid, weekKey: weekSundayKey, type: { in: ["EARNED", "PAID"] } },
        })
      );
      continue;
    }
    const amountCents = row.breakdown.totalCents;
    ops.push(
      prisma.weeklyPayout.upsert({
        where: {
          userId_weekKey: { userId: uid, weekKey: weekSundayKey },
        },
        create: {
          userId: uid,
          weekKey: weekSundayKey,
          amountCents,
          paidAt: paid ? new Date() : null,
        },
        update: {
          amountCents,
          paidAt: paid ? new Date() : null,
        },
      }),
      prisma.memberLedgerEntry.upsert({
        where: {
          userId_weekKey_type: { userId: uid, weekKey: weekSundayKey, type: "EARNED" },
        },
        create: {
          organizationId: oid,
          userId: uid,
          weekKey: weekSundayKey,
          type: "EARNED",
          amountCents,
          createdByRole: "RABBI",
        },
        update: {
          amountCents,
        },
      }),
      paid
        ? prisma.memberLedgerEntry.upsert({
            where: {
              userId_weekKey_type: { userId: uid, weekKey: weekSundayKey, type: "PAID" },
            },
            create: {
              organizationId: oid,
              userId: uid,
              weekKey: weekSundayKey,
              type: "PAID",
              amountCents,
              createdByRole: "RABBI",
            },
            update: {
              amountCents,
            },
          })
        : prisma.memberLedgerEntry.deleteMany({
            where: { userId: uid, weekKey: weekSundayKey, type: "PAID" },
          })
    );
  }
  await prisma.$transaction(ops);

  res.json({ ok: true, weekSundayKey, updated: Object.keys(marks).length });
});

rabbiRouter.get("/treasury", async (req, res) => {
  const oid = orgId(req);
  const t = await getTreasuryForOrg(oid);
  res.json(t);
});

rabbiRouter.post("/treasury/fund", async (req, res) => {
  const oid = orgId(req);
  const parsed = treasuryFundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const t = await getTreasuryForOrg(oid);
  const updated = await prisma.treasury.update({
    where: { id: t.id },
    data: { balanceCents: t.balanceCents + parsed.data.deltaCents },
  });
  res.json(updated);
});

rabbiRouter.patch("/treasury/lock", async (req, res) => {
  const oid = orgId(req);
  const parsed = treasuryLockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const t = await getTreasuryForOrg(oid);
  const updated = await prisma.treasury.update({
    where: { id: t.id },
    data: { systemLocked: parsed.data.systemLocked },
  });
  res.json(updated);
});

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

rabbiRouter.get("/export/week/:weekKey.csv", async (req, res) => {
  const oid = orgId(req);
  const org = await prisma.organization.findUnique({ where: { id: oid } });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const parsed = weekKeyParam.safeParse(req.params.weekKey);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { weekSundayKey, rows } = await computeAllMembersWeekSummary(
    parsed.data,
    oid,
    org.timezone
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
      const daily = r.breakdown.dailyLines.reduce((s, l) => s + l.amountCents, 0);
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

const rabbiBannerSchema = z.object({
  rabbiBanner: z.union([z.string().max(2000), z.null()]),
});

/** Rabbi-managed public banner message for this location. */
rabbiRouter.patch("/settings/banner", async (req, res) => {
  const oid = orgId(req);
  const parsed = rabbiBannerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = await prisma.organization.update({
    where: { id: oid },
    data: { rabbiBanner: parsed.data.rabbiBanner },
    select: { rabbiBanner: true },
  });
  res.json({ rabbiBanner: updated.rabbiBanner ?? null });
});

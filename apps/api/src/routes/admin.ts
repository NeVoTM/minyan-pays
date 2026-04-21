import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin, type JwtPayload } from "../middleware/auth.js";
import { todayDateKeyInZone } from "../lib/dates.js";
import {
  computeAllMembersWeekSummary,
  getOrganizationSettings,
  getTreasuryForOrg,
  rankFirstNine,
} from "../lib/earnings.js";
import { normalizeOptionalUsPhone, normalizePhone } from "../lib/phone.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  assertNoMemberDuplicates,
  DuplicateMemberError,
} from "../lib/memberDuplicates.js";
import { memberFieldsSchema, memberUpdateSchema } from "../lib/memberSchemas.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

function orgId(req: Request): string {
  return (req as Request & { auth: JwtPayload }).auth.organizationId;
}

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

const attendanceTxnUpdateSchema = z.object({
  punchInAt: z.string().datetime().optional(),
  punchOutAt: z.union([z.string().datetime(), z.null()]).optional(),
  punchInStatus: z.enum(["PENDING", "CONFIRMED", "REJECTED"]).optional(),
});

adminRouter.get("/session/today", async (req, res) => {
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
  const oid = orgId(req);
  const parsed = memberFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  try {
    await assertNoMemberDuplicates(prisma, {
      organizationId: oid,
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

  const attendanceCodeNorm = d.attendanceCode.trim();
  const codeTaken = await prisma.user.findFirst({
    where: {
      organizationId: oid,
      attendanceCode: attendanceCodeNorm,
      role: "MEMBER",
    },
    select: { id: true },
  });
  if (codeTaken) {
    res.status(409).json({
      error:
        "That punch-in code is already assigned to another member. Choose a different code.",
    });
    return;
  }

  const pinHash = await bcrypt.hash(d.pin, 10);
  try {
    const user = await prisma.user.create({
      data: {
        organizationId: oid,
        firstName: d.firstName.trim(),
        lastName: d.lastName.trim(),
        phone,
        pinHash,
        attendanceCode: attendanceCodeNorm,
        isMarried: d.isMarried ?? false,
        zellePhone: trimOrNull(d.zellePhone ?? undefined),
        wifeZellePhone: trimOrNull(d.wifeZellePhone ?? undefined),
        bonusRecipient: d.bonusRecipient ?? "WIFE",
        addressLine1: d.addressLine1.trim(),
        addressLine2: trimOrNull(d.addressLine2 ?? undefined),
        city: d.city.trim(),
        stateRegion: d.stateRegion.trim(),
        postalCode: d.postalCode.trim(),
        email: d.email ?? null,
        spousePhone: normalizeOptionalUsPhone(d.spousePhone ?? null),
        spouseEmail: d.spouseEmail ?? null,
        paypalAccount: trimOrNull(d.paypalAccount ?? undefined),
        achRoutingNumber: trimOrNull(d.achRoutingNumber ?? undefined),
        achAccountNumber: trimOrNull(d.achAccountNumber ?? undefined),
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
    const msg = e instanceof Error ? e.message : "Create failed";
    res.status(409).json({ error: msg });
  }
});

adminRouter.get("/members", async (req, res) => {
  const oid = orgId(req);
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", organizationId: oid },
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
      email: true,
      spousePhone: true,
      spouseEmail: true,
      paypalAccount: true,
      achRoutingNumber: true,
      achAccountNumber: true,
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
  const oid = orgId(req);
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, role: "MEMBER", organizationId: oid },
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
      email: true,
      spousePhone: true,
      spouseEmail: true,
      paypalAccount: true,
      achRoutingNumber: true,
      achAccountNumber: true,
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
  const oid = orgId(req);
  const parsed = memberUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, role: "MEMBER", organizationId: oid },
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
    isApproved: p.isApproved ?? existing.isApproved,
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

adminRouter.delete("/members/:id", async (req, res) => {
  const oid = orgId(req);
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, role: "MEMBER", organizationId: oid },
  });
  if (!existing) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  await prisma.user.delete({ where: { id: existing.id } });
  res.status(204).send();
});

adminRouter.post("/attendance/:id/confirm", async (req, res) => {
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
  const oid = orgId(req);
  const id = req.params.id;
  const att = await prisma.attendance.findFirst({
    where: { id, session: { organizationId: oid } },
  });
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

adminRouter.get("/attendance", async (req, res) => {
  const oid = orgId(req);
  const rows = await prisma.attendance.findMany({
    where: { session: { organizationId: oid } },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          attendanceCode: true,
        },
      },
      session: {
        select: {
          id: true,
          dateKey: true,
        },
      },
    },
    orderBy: [{ punchInAt: "desc" }],
    take: 1000,
  });
  res.json(
    rows.map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      sessionDateKey: a.session?.dateKey ?? "",
      userId: a.userId,
      userDisplayName: fullName(a.user.firstName, a.user.lastName),
      userPhone: a.user.phone,
      userPunchInCode: a.user.attendanceCode,
      punchInAt: a.punchInAt.toISOString(),
      punchInStatus: a.punchInStatus,
      punchInConfirmedAt: a.punchInConfirmedAt?.toISOString() ?? null,
      punchOutAt: a.punchOutAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

adminRouter.patch("/attendance/:id", async (req, res) => {
  const oid = orgId(req);
  const parsed = attendanceTxnUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.attendance.findFirst({
    where: { id: req.params.id, session: { organizationId: oid } },
  });
  if (!existing) {
    res.status(404).json({ error: "Attendance transaction not found" });
    return;
  }
  const p = parsed.data;
  const updateData: Prisma.AttendanceUpdateInput = {};
  if (p.punchInAt !== undefined) {
    updateData.punchInAt = new Date(p.punchInAt);
  }
  if (p.punchOutAt !== undefined) {
    updateData.punchOutAt = p.punchOutAt ? new Date(p.punchOutAt) : null;
  }
  if (p.punchInStatus !== undefined) {
    updateData.punchInStatus = p.punchInStatus;
    if (p.punchInStatus === "CONFIRMED") {
      updateData.punchInConfirmedAt = existing.punchInConfirmedAt ?? new Date();
    } else if (p.punchInStatus === "PENDING") {
      updateData.punchInConfirmedAt = null;
    }
  }
  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: updateData,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          attendanceCode: true,
        },
      },
      session: { select: { dateKey: true } },
    },
  });
  res.json({
    id: updated.id,
    sessionId: updated.sessionId,
    sessionDateKey: updated.session?.dateKey ?? "",
    userId: updated.userId,
    userDisplayName: fullName(updated.user.firstName, updated.user.lastName),
    userPhone: updated.user.phone,
    userPunchInCode: updated.user.attendanceCode,
    punchInAt: updated.punchInAt.toISOString(),
    punchInStatus: updated.punchInStatus,
    punchInConfirmedAt: updated.punchInConfirmedAt?.toISOString() ?? null,
    punchOutAt: updated.punchOutAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

adminRouter.delete("/attendance/:id", async (req, res) => {
  const oid = orgId(req);
  const existing = await prisma.attendance.findFirst({
    where: { id: req.params.id, session: { organizationId: oid } },
  });
  if (!existing) {
    res.status(404).json({ error: "Attendance transaction not found" });
    return;
  }
  await prisma.attendance.delete({ where: { id: existing.id } });
  res.status(204).send();
});

const orgSettingsPublicSelect = {
  id: true,
  slug: true,
  name: true,
  kind: true,
  synagogueName: true,
  rabbiBanner: true,
  firstNineCents: true,
  weeklyBonusCents: true,
  firstNineSlots: true,
  minReserveCents: true,
  timezone: true,
  defaultLocale: true,
  createdAt: true,
  updatedAt: true,
} as const;

adminRouter.patch("/settings", async (req, res) => {
  const oid = orgId(req);
  const schema = z.object({
    synagogueName: z.string().optional(),
    rabbiBanner: z.union([z.string().max(2000), z.null()]).optional(),
    rabbiPassword: z
      .union([z.string().trim().min(4).max(64), z.null()])
      .optional(),
    firstNineCents: z.number().int().min(0).optional(),
    weeklyBonusCents: z.number().int().min(0).optional(),
    firstNineSlots: z.number().int().min(1).max(50).optional(),
    minReserveCents: z.number().int().min(0).optional(),
    timezone: z.string().min(1).max(80).optional(),
    defaultLocale: z.enum(["en", "he", "es", "ru", "fr"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updateData: Prisma.OrganizationUpdateInput = {
    ...parsed.data,
  };
  delete (updateData as { rabbiPassword?: string | null }).rabbiPassword;
  if (parsed.data.rabbiPassword !== undefined) {
    updateData.rabbiPasswordHash = parsed.data.rabbiPassword
      ? await bcrypt.hash(parsed.data.rabbiPassword, 10)
      : null;
  }

  const s = await prisma.organization.update({
    where: { id: oid },
    data: updateData,
    select: orgSettingsPublicSelect,
  });
  res.json(s);
});

adminRouter.get("/settings", async (req, res) => {
  const oid = orgId(req);
  const s = await prisma.organization.findUnique({
    where: { id: oid },
    select: orgSettingsPublicSelect,
  });
  if (!s) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(s);
});

adminRouter.post("/treasury/fund", async (req, res) => {
  const oid = orgId(req);
  const schema = z.object({ deltaCents: z.number().int() });
  const parsed = schema.safeParse(req.body);
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

adminRouter.patch("/treasury/lock", async (req, res) => {
  const oid = orgId(req);
  const schema = z.object({ systemLocked: z.boolean() });
  const parsed = schema.safeParse(req.body);
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

adminRouter.get("/treasury", async (req, res) => {
  const oid = orgId(req);
  const t = await getTreasuryForOrg(oid);
  res.json(t);
});

const weekKeyParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD (any day in the week)");

adminRouter.get("/reports/week/:weekKey", async (req, res) => {
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
  const summary = await computeAllMembersWeekSummary(
    parsed.data,
    oid,
    org.timezone
  );
  res.json(summary);
});

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

adminRouter.get("/export/week/:weekKey.csv", async (req, res) => {
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

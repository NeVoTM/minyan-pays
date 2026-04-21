import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  requireRabbi,
  type JwtPayload,
} from "../middleware/auth.js";
import { todayDateKeyInZone } from "../lib/dates.js";
import {
  computeAllMembersWeekSummary,
  getOrganizationSettings,
  getTreasuryForOrg,
  rankFirstNine,
} from "../lib/earnings.js";
import { fullName } from "../lib/memberDisplay.js";

export const rabbiRouter = Router();
rabbiRouter.use(authMiddleware);
rabbiRouter.use(requireRabbi);

function orgId(req: Request): string {
  return (req as Request & { auth: JwtPayload }).auth.organizationId;
}

const weekKeyParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD (any day in the week)");

/** Members waiting for approval at this location. */
rabbiRouter.get("/members/pending", async (req, res) => {
  const oid = orgId(req);
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", organizationId: oid, isApproved: false },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      attendanceCode: true,
      addressLine1: true,
      city: true,
      stateRegion: true,
      postalCode: true,
      email: true,
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

/** Approve a pending member (rabbi only). */
rabbiRouter.post("/members/:id/approve", async (req, res) => {
  const oid = orgId(req);
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: "MEMBER",
      organizationId: oid,
      isApproved: false,
    },
  });
  if (!user) {
    res.status(404).json({ error: "Pending member not found" });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isApproved: true },
  });
  res.json({
    id: updated.id,
    displayName: fullName(updated.firstName, updated.lastName),
    isApproved: updated.isApproved,
  });
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

rabbiRouter.post("/attendance/:id/reject", async (req, res) => {
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
  });
});

const payoutMarkSchema = z.object({
  /** userId -> paid */
  marks: z.record(z.string(), z.boolean()),
});

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

  await prisma.$transaction(
    Object.entries(marks).map(([uid, paid]) => {
      const row = rowByUser.get(uid);
      if (!row) {
        return prisma.weeklyPayout.deleteMany({
          where: { userId: uid, weekKey: weekSundayKey },
        });
      }
      const amountCents = row.breakdown.totalCents;
      return prisma.weeklyPayout.upsert({
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
      });
    })
  );

  res.json({ ok: true, weekSundayKey, updated: Object.keys(marks).length });
});

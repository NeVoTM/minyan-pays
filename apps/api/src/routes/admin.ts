import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pinHashFromOptionalPin } from "../lib/pinHash.js";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  requireAdmin,
  signAdminToken,
  type JwtPayload,
} from "../middleware/auth.js";
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
import { normalizeOrgSlug } from "../lib/organizationService.js";
import {
  adminNotifyEmail,
  emailConfigured,
  generate6DigitCode,
  sendEmail,
} from "../lib/email.js";
import {
  getGlobalAdminPasswordHash,
  getGlobalAdminPasswordPlain,
  setGlobalAdminPassword,
} from "../lib/settings.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

const adminChangePasswordBody = z.object({
  newPassword: z.string().min(8).max(128),
  currentPassword: z.string().optional(),
});

/** Set or rotate admin password (bcrypt on Organization). Bootstrap sessions skip current password. */
adminRouter.post("/account/password", async (req, res) => {
  const parsed = adminChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const auth = (req as Request & { auth: JwtPayload }).auth;
  const oid = auth.organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: oid },
    select: { adminPasswordHash: true },
  });
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  if (auth.adminMustChangePassword !== true) {
    const cur = parsed.data.currentPassword?.trim();
    if (!cur) {
      res.status(400).json({ error: "Current password required" });
      return;
    }
    if (!org.adminPasswordHash) {
      res.status(400).json({ error: "Invalid state" });
      return;
    }
    const ok = await bcrypt.compare(cur, org.adminPasswordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid current password" });
      return;
    }
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.organization.update({
    where: { id: oid },
    data: { adminPasswordHash: hash },
  });
  res.json({
    token: signAdminToken(oid, { adminMustChangePassword: false }),
  });
});

adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  const auth = (req as Request & { auth?: JwtPayload }).auth;
  if (auth?.role === "ADMIN" && auth.adminMustChangePassword === true) {
    res.status(403).json({
      error: "Change admin password before continuing.",
      code: "ADMIN_PASSWORD_CHANGE_REQUIRED",
    });
    return;
  }
  next();
});

function orgId(req: Request): string {
  return (req as Request & { auth: JwtPayload }).auth.organizationId;
}

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || s === "") return null;
  const t = s.trim();
  return t || null;
}

/** Admin may adjust punch times only; rabbi confirms or rejects check-ins. */
const adminAttendanceTxnUpdateSchema = z.object({
  punchInAt: z.string().datetime().optional(),
  punchOutAt: z.union([z.string().datetime(), z.null()]).optional(),
});

const createOrganizationBody = z.object({
  slug: z.string().min(2).max(64),
  name: z.string().min(1).max(120),
  synagogueName: z.string().min(1).max(120),
  kind: z.enum(["SYNAGOGUE", "STUDY_HALL"]).optional(),
  timezone: z.string().min(1).max(80).optional(),
});

const rabbiProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.union([z.string().max(300), z.null()]).optional(),
  city: z.union([z.string().max(120), z.null()]).optional(),
  stateRegion: z.union([z.string().max(120), z.null()]).optional(),
  postalCode: z.union([z.string().max(30), z.null()]).optional(),
  phone: z.union([z.string().max(40), z.null()]).optional(),
  email: z.union([z.string().email(), z.null()]).optional(),
});

/** All locations (for treasurer overview). */
adminRouter.get("/organizations", async (_req, res) => {
  const rows = await prisma.organization.findMany({
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      name: true,
      kind: true,
      synagogueName: true,
      locationAddress: true,
      timezone: true,
      createdAt: true,
    },
  });
  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

adminRouter.post("/organizations", async (req, res) => {
  const parsed = createOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const slug = normalizeOrgSlug(parsed.data.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug (lowercase letters, numbers, hyphens)." });
    return;
  }
  const taken = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (taken) {
    res.status(409).json({ error: "That location key is already in use." });
    return;
  }
  try {
    const org = await prisma.organization.create({
      data: {
        slug,
        name: parsed.data.name.trim(),
        synagogueName: parsed.data.synagogueName.trim(),
        kind: parsed.data.kind ?? "SYNAGOGUE",
        timezone: parsed.data.timezone ?? "America/New_York",
        treasury: {
          create: { balanceCents: 0, systemLocked: false },
        },
      },
      select: { slug: true, name: true, synagogueName: true },
    });
    res.status(201).json(org);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create failed";
    res.status(409).json({ error: msg });
  }
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

  const pinHash = await pinHashFromOptionalPin(d.pin);
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
        addressLine2: null,
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
      preferredForCheckIn: true,
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

adminRouter.post("/attendance/:id/confirm", async (_req, res) => {
  res.status(403).json({
    error: "Check-ins are confirmed or rejected by the rabbi only.",
  });
});

adminRouter.post("/attendance/:id/reject", async (_req, res) => {
  res.status(403).json({
    error: "Check-ins are confirmed or rejected by the rabbi only.",
  });
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
  const parsed = adminAttendanceTxnUpdateSchema.safeParse(req.body);
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

adminRouter.get("/rabbis", async (req, res) => {
  const oid = orgId(req);
  const rabbis = await prisma.rabbi.findMany({
    where: { organizationId: oid },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
  res.json(rabbis);
});

adminRouter.post("/rabbis", async (req, res) => {
  const oid = orgId(req);
  const parsed = rabbiProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const rabbi = await prisma.rabbi.create({
    data: {
      organizationId: oid,
      name: d.name.trim(),
      address: trimOrNull(d.address),
      city: trimOrNull(d.city),
      stateRegion: trimOrNull(d.stateRegion),
      postalCode: trimOrNull(d.postalCode),
      phone: normalizeOptionalUsPhone(d.phone ?? null),
      email: trimOrNull(d.email),
    },
  });
  res.status(201).json(rabbi);
});

adminRouter.patch("/rabbis/:id", async (req, res) => {
  const oid = orgId(req);
  const parsed = rabbiProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.rabbi.findFirst({
    where: { id: req.params.id, organizationId: oid },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Rabbi not found" });
    return;
  }
  const d = parsed.data;
  const rabbi = await prisma.rabbi.update({
    where: { id: existing.id },
    data: {
      name: d.name.trim(),
      address: trimOrNull(d.address),
      city: trimOrNull(d.city),
      stateRegion: trimOrNull(d.stateRegion),
      postalCode: trimOrNull(d.postalCode),
      phone: normalizeOptionalUsPhone(d.phone ?? null),
      email: trimOrNull(d.email),
    },
  });
  res.json(rabbi);
});

adminRouter.delete("/rabbis/:id", async (req, res) => {
  const oid = orgId(req);
  const existing = await prisma.rabbi.findFirst({
    where: { id: req.params.id, organizationId: oid },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Rabbi not found" });
    return;
  }
  await prisma.rabbi.delete({ where: { id: existing.id } });
  res.status(204).send();
});

const orgSettingsPublicSelect = {
  id: true,
  slug: true,
  name: true,
  kind: true,
  synagogueName: true,
  locationAddress: true,
  locationPhone: true,
  locationEmail: true,
  locationWebsite: true,
  rabbiName: true,
  rabbiAddress: true,
  rabbiPhone: true,
  rabbiEmail: true,
  rabbiBanner: true,
  firstNineCents: true,
  weeklyBonusCents: true,
  firstNineSlots: true,
  minReserveCents: true,
  timezone: true,
  defaultLocale: true,
  checkInOnlyPreferred: true,
  checkInLatitude: true,
  checkInLongitude: true,
  createdAt: true,
  updatedAt: true,
} as const;

adminRouter.patch("/settings", async (req, res) => {
  const oid = orgId(req);
  const schema = z.object({
    synagogueName: z.string().optional(),
    locationAddress: z.union([z.string().max(300), z.null()]).optional(),
    locationPhone: z.union([z.string().max(40), z.null()]).optional(),
    locationEmail: z.union([z.string().email(), z.null()]).optional(),
    locationWebsite: z.union([z.string().url(), z.null()]).optional(),
    rabbiName: z.union([z.string().max(120), z.null()]).optional(),
    rabbiAddress: z.union([z.string().max(300), z.null()]).optional(),
    rabbiPhone: z.union([z.string().max(40), z.null()]).optional(),
    rabbiEmail: z.union([z.string().email(), z.null()]).optional(),
    rabbiBanner: z.union([z.string().max(2000), z.null()]).optional(),
    rabbiPassword: z
      .union([
        z
          .string()
          .trim()
          .regex(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+\-_=?])[A-Za-z0-9!@#$%^&*+\-_=?]{8}$/,
            "Rabbi password must be exactly 8 characters and include at least one letter, one digit, and one special character (!@#$%^&*+-_=?).",
          ),
        z.null(),
      ])
      .optional(),
    firstNineCents: z.number().int().min(0).optional(),
    weeklyBonusCents: z.number().int().min(0).optional(),
    firstNineSlots: z.number().int().min(1).max(50).optional(),
    minReserveCents: z.number().int().min(0).optional(),
    timezone: z.string().min(1).max(80).optional(),
    defaultLocale: z.enum(["en", "he", "es", "ru", "fr"]).optional(),
    checkInLatitude: z.number().gte(-90).lte(90).nullable().optional(),
    checkInLongitude: z.number().gte(-180).lte(180).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updateData: Prisma.OrganizationUpdateInput = {
    ...parsed.data,
  };
  if (parsed.data.locationPhone !== undefined) {
    updateData.locationPhone = normalizeOptionalUsPhone(parsed.data.locationPhone);
  }
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

// --------------------------------------------------------------------------
// GLOBAL ADMIN PASSWORD
//
// One password that authenticates the admin into every organization. Stored
// as a Setting key/value pair (hash + plaintext). Two write paths:
//   1. POST /global-password/bootstrap — first-time setup; refuses once set.
//   2. POST /global-password/request-change + /confirm-change — every other
//      change requires a 6-digit code emailed to ADMIN_NOTIFY_EMAIL.
// --------------------------------------------------------------------------

const GLOBAL_ADMIN_PASSWORD_RE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+\-_=?])[A-Za-z0-9!@#$%^&*+\-_=?]{8}$/;

const GLOBAL_ADMIN_PASSWORD_RULE_MSG =
  "Global admin password must be exactly 8 characters and include at least one letter, one digit, and one special character (!@#$%^&*+-_=?).";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function adminEchoCodeEnabled(): boolean {
  const v = process.env.ADMIN_PASSWORD_VERIFICATION_ECHO?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Current global password status — `isSet` and (if set) the plaintext. */
adminRouter.get("/global-password", async (_req, res) => {
  const hash = await getGlobalAdminPasswordHash();
  const plain = hash ? await getGlobalAdminPasswordPlain() : null;
  res.json({
    isSet: !!hash,
    plain: plain ?? null,
    notifyEmail: adminNotifyEmail(),
    emailConfigured: emailConfigured(),
  });
});

/** First-time setup. Allowed only when no global password exists yet. */
adminRouter.post("/global-password/bootstrap", async (req, res) => {
  const schema = z.object({ password: z.string().regex(GLOBAL_ADMIN_PASSWORD_RE) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: GLOBAL_ADMIN_PASSWORD_RULE_MSG });
    return;
  }
  const existing = await getGlobalAdminPasswordHash();
  if (existing) {
    res.status(409).json({
      error:
        "Global admin password already set. Use the request-change flow to rotate it.",
    });
    return;
  }
  const plain = parsed.data.password.trim();
  const hash = await bcrypt.hash(plain, 10);
  await setGlobalAdminPassword({ hash, plain });
  res.json({ ok: true });
});

/** Stage a new global admin password and email a 6-digit code to confirm. */
adminRouter.post("/global-password/request-change", async (req, res) => {
  const schema = z.object({ newPassword: z.string().regex(GLOBAL_ADMIN_PASSWORD_RE) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: GLOBAL_ADMIN_PASSWORD_RULE_MSG });
    return;
  }

  const echo = adminEchoCodeEnabled();
  if (!emailConfigured() && !echo) {
    res.status(503).json({
      error:
        "Email transport not configured. Ask your admin to set GMAIL_USER + GMAIL_APP_PASSWORD on Render (or set ADMIN_PASSWORD_VERIFICATION_ECHO=1 for dev).",
    });
    return;
  }

  const code = generate6DigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const newPasswordPlain = parsed.data.newPassword.trim();
  const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10);
  const email = adminNotifyEmail();

  // Keep at most one active request per email — invalidate older ones.
  await prisma.adminPasswordChangeRequest.updateMany({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date(0) },
  });

  const created = await prisma.adminPasswordChangeRequest.create({
    data: {
      email,
      codeHash,
      newPasswordHash,
      newPasswordPlain,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
    },
    select: { id: true, email: true, expiresAt: true },
  });

  let emailDelivered: { ok: boolean; error?: string } = { ok: false };
  if (emailConfigured()) {
    const subject = "MinyanPays — Confirm admin password change";
    const text = `Your MinyanPays admin password change code is ${code}.\nIt expires in 10 minutes.\n\nIf you did not request this change, ignore this email.`;
    const html = `<p>Your MinyanPays admin password change code is <b>${code}</b>.</p><p>It expires in 10 minutes.</p><p style="color:#666">If you did not request this change, ignore this email.</p>`;
    const r = await sendEmail({ to: email, subject, text, html });
    emailDelivered = r.ok ? { ok: true } : { ok: false, error: r.error };
  }

  res.json({
    requestId: created.id,
    email: created.email,
    expiresAt: created.expiresAt,
    emailDelivered: emailDelivered.ok,
    emailError: emailDelivered.ok ? null : emailDelivered.error ?? null,
    devCode: echo ? code : undefined,
  });
});

/** Verify the 6-digit code and apply the staged global admin password. */
adminRouter.post("/global-password/confirm-change", async (req, res) => {
  const schema = z.object({
    requestId: z.string().min(1),
    code: z.string().min(4).max(12),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const reqRow = await prisma.adminPasswordChangeRequest.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!reqRow) {
    res.status(404).json({ error: "Unknown change request." });
    return;
  }
  if (reqRow.consumedAt) {
    res.status(409).json({ error: "This change request was already used." });
    return;
  }
  if (reqRow.expiresAt.getTime() <= Date.now()) {
    res.status(410).json({ error: "Confirmation code expired. Request a new one." });
    return;
  }
  if (reqRow.attempts >= MAX_CODE_ATTEMPTS) {
    res.status(429).json({ error: "Too many attempts. Request a new code." });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.code.trim(), reqRow.codeHash);
  if (!ok) {
    await prisma.adminPasswordChangeRequest.update({
      where: { id: reqRow.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(401).json({ error: "Invalid confirmation code." });
    return;
  }

  await setGlobalAdminPassword({
    hash: reqRow.newPasswordHash,
    plain: reqRow.newPasswordPlain,
  });
  await prisma.adminPasswordChangeRequest.update({
    where: { id: reqRow.id },
    data: { consumedAt: new Date() },
  });

  res.json({ ok: true });
});

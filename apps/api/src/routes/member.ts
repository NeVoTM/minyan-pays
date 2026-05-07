import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getMemberBalanceDetail } from "../lib/earnings.js";
import { fullName } from "../lib/memberDisplay.js";
import {
  authMiddleware,
  requireApprovedMember,
  type JwtPayload,
} from "../middleware/auth.js";
import { memberSelfUpdateSchema } from "../lib/memberSchemas.js";
import {
  isTwilioReady,
  sendProfileVerificationSms,
} from "../lib/smsVerification.js";

export const memberRouter = Router();
memberRouter.use(authMiddleware);
memberRouter.use(requireApprovedMember);

const verificationSendSchema = z.object({
  purpose: z.literal("PROFILE_CHANGE"),
});

const profileUpdateSchema = memberSelfUpdateSchema.extend({
  pin: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v).trim()),
    z.union([z.undefined(), z.string().min(4).max(12)])
  ),
  verificationCode: z.preprocess((v) => {
    if (v == null || v === "") return "";
    return String(v).replace(/\D/g, "").slice(0, 6);
  }, z.string().length(6, { message: "Enter the 6-digit code (tap Send code first)." })),
});

const cashoutSchema = z
  .object({
    amountCents: z.number().int().positive().optional(),
    percentage: z.number().min(1).max(100).optional(),
  })
  .refine((v) => v.amountCents || v.percentage, {
    message: "Provide amountCents or percentage",
  });

const donateSchema = z
  .object({
    charityId: z.string().min(1),
    amountCents: z.number().int().positive().optional(),
    percentage: z.number().min(1).max(100).optional(),
  })
  .refine((v) => v.amountCents || v.percentage, {
    message: "Provide amountCents or percentage",
  });

function authFrom(req: Request) {
  return (req as Request & { auth: JwtPayload }).auth;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function startOfDayIsoDaysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

async function getFinancialSummary(userId: string, organizationId: string, tz: string) {
  const detail = await getMemberBalanceDetail(userId, organizationId, tz);
  const totalEarnedCents = Object.values(detail.earningsByWeek).reduce(
    (sum, row) => sum + row.totalCents,
    0
  );
  const paidRows = await prisma.weeklyPayout.findMany({
    where: { userId, user: { organizationId }, paidAt: { not: null } },
    select: { amountCents: true, paidAt: true },
  });
  const totalPaidCents = paidRows.reduce((sum, r) => sum + r.amountCents, 0);

  const donations = await prisma.memberLedgerEntry.findMany({
    where: { userId, organizationId, type: "DONATED" },
    select: { amountCents: true, charityId: true, createdAt: true, charity: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const totalDonatedCents = donations.reduce((sum, d) => sum + d.amountCents, 0);

  const paidAfter7DaysCutoff = startOfDayIsoDaysAgo(7);
  const eligibleWeekRows = await prisma.weeklyPayout.findMany({
    where: {
      userId,
      user: { organizationId },
      paidAt: null,
      createdAt: { lte: paidAfter7DaysCutoff },
    },
    select: { amountCents: true },
  });
  const eligibleCashoutCents = eligibleWeekRows.reduce((sum, row) => sum + row.amountCents, 0);

  const owedCents = Math.max(0, totalEarnedCents - totalPaidCents - totalDonatedCents);
  return {
    totals: {
      earnedCents: totalEarnedCents,
      paidCents: totalPaidCents,
      donatedCents: totalDonatedCents,
      owedCents,
      eligibleCashoutCents: Math.min(eligibleCashoutCents, owedCents),
    },
    donations: donations.map((d) => ({
      amountCents: d.amountCents,
      charityId: d.charityId,
      charityName: d.charity?.name ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    detail,
  };
}

memberRouter.get("/profile", async (req: Request, res) => {
  const auth = authFrom(req);
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      isMarried: true,
      zellePhone: true,
      wifeZellePhone: true,
      bonusRecipient: true,
      pinHash: true,
      attendanceCode: true,
      addressLine1: true,
      city: true,
      stateRegion: true,
      postalCode: true,
      email: true,
      paypalAccount: true,
      isApproved: true,
      organizationId: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.organizationId !== auth.organizationId) {
    res.status(403).json({ error: "Invalid session" });
    return;
  }
  const { pinHash, ...safe } = user;
  res.json({
    ...safe,
    hasPin: Boolean(pinHash),
    displayName: fullName(user.firstName, user.lastName),
  });
});

memberRouter.get("/balance", async (req: Request, res) => {
  const auth = authFrom(req);
  const org = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { timezone: true },
  });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const summary = await getFinancialSummary(auth.sub, auth.organizationId, org.timezone);
  res.json(summary);
});

memberRouter.get("/charities", async (req, res) => {
  const auth = authFrom(req);
  const items = await prisma.charity.findMany({
    where: { organizationId: auth.organizationId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, website: true, description: true },
  });
  res.json({ items });
});

memberRouter.post("/profile/verification/send", async (req, res) => {
  const auth = authFrom(req);
  const parsed = verificationSendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, phone: true, organizationId: true },
  });
  if (!user || user.organizationId !== auth.organizationId) {
    res.status(403).json({ error: "Invalid session" });
    return;
  }
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const echoCode =
    process.env.NODE_ENV !== "production" ||
    process.env.MEMBER_VERIFICATION_ECHO_CODE === "1" ||
    process.env.MEMBER_VERIFICATION_ECHO_CODE === "true";

  const created = await prisma.memberChangeCode.create({
    data: {
      userId: user.id,
      purpose: "PROFILE_CHANGE",
      codeHash: sha256(`${code}:${user.id}`),
      expiresAt,
    },
  });

  if (echoCode) {
    console.log(`[SMS-VERIFY] dev echo to ${user.phone}: ${code}`);
    res.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
      devCode: code,
    });
    return;
  }

  if (!isTwilioReady()) {
    await prisma.memberChangeCode.delete({ where: { id: created.id } });
    res.status(503).json({
      error:
        "Text verification is not set up on this server yet. Ask your administrator to configure Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER), or use a staging build with MEMBER_VERIFICATION_ECHO_CODE.",
    });
    return;
  }

  const sent = await sendProfileVerificationSms(user.phone, code);
  if (!sent.ok) {
    await prisma.memberChangeCode.delete({ where: { id: created.id } });
    console.error(`[SMS-VERIFY] Twilio failed for ${user.phone}: ${sent.error}`);
    res.status(502).json({
      error:
        "Could not send the verification text. Check the phone number on your account and try again, or contact support.",
    });
    return;
  }

  res.json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
  });
});

memberRouter.patch("/profile", async (req, res) => {
  const auth = authFrom(req);
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { verificationCode, pin, ...fields } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, organizationId: true },
  });
  if (!user || user.organizationId !== auth.organizationId) {
    res.status(403).json({ error: "Invalid session" });
    return;
  }

  const code = await prisma.memberChangeCode.findFirst({
    where: {
      userId: user.id,
      purpose: "PROFILE_CHANGE",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!code || code.codeHash !== sha256(`${verificationCode}:${user.id}`)) {
    res.status(401).json({ error: "Invalid or expired verification code" });
    return;
  }

  const data: Record<string, unknown> = { ...fields };
  if (pin?.trim()) data.pinHash = await bcrypt.hash(pin.trim(), 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data }),
    prisma.memberChangeCode.update({
      where: { id: code.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  res.json({ ok: true });
});

memberRouter.post("/balance/cashout-request", async (req, res) => {
  const auth = authFrom(req);
  const parsed = cashoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const org = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { timezone: true },
  });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const summary = await getFinancialSummary(auth.sub, auth.organizationId, org.timezone);
  const requested =
    parsed.data.amountCents ??
    Math.floor((summary.totals.eligibleCashoutCents * parsed.data.percentage!) / 100);
  if (requested <= 0) {
    res.status(400).json({ error: "Requested amount must be positive" });
    return;
  }
  if (requested > summary.totals.eligibleCashoutCents) {
    res.status(400).json({ error: "Requested amount exceeds eligible cashout balance" });
    return;
  }

  const created = await prisma.cashoutRequest.create({
    data: {
      userId: auth.sub,
      organizationId: auth.organizationId,
      amountCents: requested,
      status: "PENDING",
    },
  });
  res.json({ ok: true, requestId: created.id, amountCents: requested });
});

memberRouter.post("/balance/donate", async (req, res) => {
  const auth = authFrom(req);
  const parsed = donateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const charity = await prisma.charity.findFirst({
    where: { id: parsed.data.charityId, organizationId: auth.organizationId, isActive: true },
    select: { id: true },
  });
  if (!charity) {
    res.status(404).json({ error: "Charity not found" });
    return;
  }
  const org = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { timezone: true },
  });
  if (!org) {
    res.status(400).json({ error: "Invalid organization" });
    return;
  }
  const summary = await getFinancialSummary(auth.sub, auth.organizationId, org.timezone);
  const requested =
    parsed.data.amountCents ??
    Math.floor((summary.totals.owedCents * parsed.data.percentage!) / 100);
  if (requested <= 0) {
    res.status(400).json({ error: "Donation amount must be positive" });
    return;
  }
  if (requested > summary.totals.owedCents) {
    res.status(400).json({ error: "Donation exceeds owed balance" });
    return;
  }

  await prisma.memberLedgerEntry.create({
    data: {
      organizationId: auth.organizationId,
      userId: auth.sub,
      type: "DONATED",
      amountCents: requested,
      charityId: charity.id,
      note: "Member self donation",
      createdByRole: "MEMBER",
    },
  });
  res.json({ ok: true, amountCents: requested });
});

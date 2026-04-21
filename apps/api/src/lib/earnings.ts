import type { Attendance, BonusRecipient, User } from "@prisma/client";
import { prisma } from "./prisma.js";
import {
  weekMinyanDateKeys,
  weekSundayKeyFromDateKey,
} from "./dates.js";
import { fullName } from "./memberDisplay.js";

export type WeekPayoutRow = {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  isMarried: boolean;
  bonusRecipient: BonusRecipient;
  zellePhone: string | null;
  wifeZellePhone: string | null;
  suggestedPayoutZelle: string | null;
  breakdown: EarningsBreakdown;
};

function suggestedZelleForPayout(
  isMarried: boolean,
  bonusRecipient: BonusRecipient,
  zellePhone: string | null,
  wifeZellePhone: string | null
): string | null {
  if (isMarried && bonusRecipient === "WIFE") {
    const w = wifeZellePhone?.trim();
    if (w) return w;
  }
  const s = zellePhone?.trim();
  return s || null;
}

export type EarningsBreakdown = {
  dailyLines: { dateKey: string; amountCents: number; firstNine: boolean }[];
  weeklyBonusCents: number;
  totalCents: number;
};

export async function getOrganizationSettings(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) throw new Error("Organization not found");
  return org;
}

export async function getTreasuryForOrg(organizationId: string) {
  let t = await prisma.treasury.findUnique({
    where: { organizationId },
  });
  if (!t) {
    t = await prisma.treasury.create({
      data: {
        organizationId,
        balanceCents: 0,
        systemLocked: false,
      },
    });
  }
  return t;
}

export function rankFirstNine(
  attendances: (Attendance & { user: User })[],
  slots: number
): Map<string, boolean> {
  const confirmed = attendances
    .filter((a) => a.punchInStatus === "CONFIRMED")
    .sort((a, b) => a.punchInAt.getTime() - b.punchInAt.getTime());
  const map = new Map<string, boolean>();
  confirmed.slice(0, slots).forEach((a) => map.set(a.userId, true));
  return map;
}

export async function computeUserWeekEarnings(
  userId: string,
  sundayKey: string,
  organizationId: string,
  tz: string
): Promise<EarningsBreakdown> {
  const settings = await getOrganizationSettings(organizationId);
  const slots = settings.firstNineSlots;
  const dailyAmount = settings.firstNineCents;
  const bonusAmount = settings.weeklyBonusCents;
  const days = weekMinyanDateKeys(sundayKey, tz);

  const sessions = await prisma.minyanSession.findMany({
    where: {
      organizationId,
      dateKey: { in: days },
    },
    include: {
      attendances: { include: { user: true } },
    },
  });

  const sessionByDate = new Map(sessions.map((s) => [s.dateKey, s]));

  const dailyLines: EarningsBreakdown["dailyLines"] = [];
  let daysPresent = 0;

  for (const dateKey of days) {
    const session = sessionByDate.get(dateKey);
    if (!session) {
      dailyLines.push({ dateKey, amountCents: 0, firstNine: false });
      continue;
    }
    const mine = session.attendances.find((a) => a.userId === userId);
    if (!mine || mine.punchInStatus !== "CONFIRMED" || !mine.punchOutAt) {
      dailyLines.push({ dateKey, amountCents: 0, firstNine: false });
      continue;
    }

    daysPresent += 1;
    const firstMap = rankFirstNine(session.attendances, slots);
    const inFirst = firstMap.get(userId) ?? false;
    const amount = inFirst ? dailyAmount : 0;
    dailyLines.push({ dateKey, amountCents: amount, firstNine: inFirst });
  }

  const weeklyBonusCents = daysPresent >= 6 ? bonusAmount : 0;
  const dailySum = dailyLines.reduce((s, l) => s + l.amountCents, 0);
  return {
    dailyLines,
    weeklyBonusCents,
    totalCents: dailySum + weeklyBonusCents,
  };
}

export async function getMemberBalanceDetail(
  userId: string,
  organizationId: string,
  tz: string
) {
  const settings = await getOrganizationSettings(organizationId);
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      punchInStatus: "CONFIRMED",
      session: { organizationId },
    },
    include: { session: true },
    orderBy: { punchInAt: "asc" },
  });

  const rows = attendances.map((a) => ({
    dateKey: a.session.dateKey,
    punchInAt: a.punchInAt.toISOString(),
    punchOutAt: a.punchOutAt?.toISOString() ?? null,
    punchInConfirmedAt: a.punchInConfirmedAt?.toISOString() ?? null,
  }));

  const weeks = new Set(
    attendances.map((a) =>
      weekSundayKeyFromDateKey(a.session.dateKey, tz)
    )
  );

  const byWeek: Record<string, EarningsBreakdown> = {};
  for (const w of weeks) {
    byWeek[w] = await computeUserWeekEarnings(
      userId,
      w,
      organizationId,
      tz
    );
  }

  return { settings, attendanceLog: rows, earningsByWeek: byWeek };
}

export async function computeAllMembersWeekSummary(
  weekKey: string,
  organizationId: string,
  tz: string
): Promise<{
  weekSundayKey: string;
  rows: WeekPayoutRow[];
}> {
  const weekSundayKey = weekSundayKeyFromDateKey(weekKey, tz);
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      isApproved: true,
      organizationId,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const rows: WeekPayoutRow[] = [];
  for (const u of members) {
    const breakdown = await computeUserWeekEarnings(
      u.id,
      weekSundayKey,
      organizationId,
      tz
    );
    rows.push({
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      displayName: fullName(u.firstName, u.lastName),
      phone: u.phone,
      isMarried: u.isMarried,
      bonusRecipient: u.bonusRecipient,
      zellePhone: u.zellePhone,
      wifeZellePhone: u.wifeZellePhone,
      suggestedPayoutZelle: suggestedZelleForPayout(
        u.isMarried,
        u.bonusRecipient,
        u.zellePhone,
        u.wifeZellePhone
      ),
      breakdown,
    });
  }

  return { weekSundayKey, rows };
}

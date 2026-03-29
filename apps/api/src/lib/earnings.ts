import type { Attendance, MinyanSession, User } from "@prisma/client";
import { prisma } from "./prisma.js";
import { weekMinyanDateKeys, weekSundayKeyFromDateKey } from "./dates.js";

export type EarningsBreakdown = {
  dailyLines: { dateKey: string; amountCents: number; firstNine: boolean }[];
  weeklyBonusCents: number;
  totalCents: number;
};

async function getSettings() {
  let s = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!s) {
    s = await prisma.appSettings.create({
      data: { id: "singleton" },
    });
  }
  return s;
}

async function getTreasury() {
  let t = await prisma.treasury.findUnique({ where: { id: "singleton" } });
  if (!t) {
    t = await prisma.treasury.create({ data: { id: "singleton" } });
  }
  return t;
}

/** Confirmed attendances for a session, ordered by punch-in time; first `slots` get daily pay. */
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
  sundayKey: string
): Promise<EarningsBreakdown> {
  const settings = await getSettings();
  const slots = settings.firstNineSlots;
  const dailyAmount = settings.firstNineCents;
  const bonusAmount = settings.weeklyBonusCents;
  const days = weekMinyanDateKeys(sundayKey);

  const sessions = await prisma.minyanSession.findMany({
    where: { dateKey: { in: days } },
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

export async function getMemberBalanceDetail(userId: string) {
  const settings = await getSettings();
  const attendances = await prisma.attendance.findMany({
    where: { userId, punchInStatus: "CONFIRMED" },
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
    attendances.map((a) => weekSundayKeyFromDateKey(a.session.dateKey))
  );

  const byWeek: Record<string, EarningsBreakdown> = {};
  for (const w of weeks) {
    byWeek[w] = await computeUserWeekEarnings(userId, w);
  }

  return { settings, attendanceLog: rows, earningsByWeek: byWeek };
}

export { getSettings, getTreasury };

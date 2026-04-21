import { addDays, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function getTimezone(): string {
  return process.env.DEFAULT_TIMEZONE ?? "America/New_York";
}

/** YYYY-MM-DD in the given IANA timezone (e.g. organization timezone). */
export function todayDateKeyInZone(tz: string, now = new Date()): string {
  return formatInTimeZone(now, tz, "yyyy-MM-dd");
}

/** @deprecated use todayDateKeyInZone with org timezone */
export function todayDateKey(now = new Date()): string {
  return todayDateKeyInZone(getTimezone(), now);
}

/** Sunday YYYY-MM-DD of the Sun–Fri week containing `dateKey`, in `tz`. */
export function weekSundayKeyFromDateKey(dateKey: string, tz: string): string {
  const localNoon = fromZonedTime(`${dateKey}T12:00:00`, tz);
  const sunday = startOfWeek(localNoon, { weekStartsOn: 0 });
  return formatInTimeZone(sunday, tz, "yyyy-MM-dd");
}

/** Six date keys: Sunday → Friday */
export function weekMinyanDateKeys(sundayKey: string, tz: string): string[] {
  const start = fromZonedTime(`${sundayKey}T12:00:00`, tz);
  return Array.from({ length: 6 }, (_, i) =>
    formatInTimeZone(addDays(start, i), tz, "yyyy-MM-dd")
  );
}

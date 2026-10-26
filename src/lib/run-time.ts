import type { RunFrequency } from "@prisma/client";

const TZ = "Africa/Lagos";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const FREQUENCY_LABELS: Record<RunFrequency, string> = {
  WEEKLY: "Every week",
  FORTNIGHTLY: "Every 2 weeks",
  MONTHLY: "Every month (same date)",
};

// A Date as the form inputs show it in Lagos: "2026-11-07" and "06:00".
export function toLagosInputs(date: Date) {
  return {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date),
  };
}

// "2026-11-07" + "06:00" (Lagos wall-clock) -> a real Date, or null if invalid.
// Lagos is UTC+1 all year, so this is exact.
export function lagosDateTimeToDate(dateStr: string, timeStr: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!d || !t) return null;

  const hours = Number(t[1]);
  const minutes = Number(t[2]);
  if (hours > 23 || minutes > 59) return null;

  const date = new Date(
    Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hours, minutes) - HOUR_MS
  );
  // Reject things like 31 February that roll over into another day.
  const back = toLagosInputs(date);
  return back.date === dateStr && back.time === timeStr ? date : null;
}

function addMonthsLagos(first: Date, months: number) {
  const local = new Date(first.getTime() + HOUR_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  const day = Math.min(local.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(year, month + months, day, local.getUTCHours(), local.getUTCMinutes()) - HOUR_MS
  );
}

// The nth run (0 = the first) of a repeating series.
export function occurrenceDate(first: Date, frequency: RunFrequency, n: number) {
  if (frequency === "WEEKLY") return new Date(first.getTime() + n * 7 * DAY_MS);
  if (frequency === "FORTNIGHTLY") return new Date(first.getTime() + n * 14 * DAY_MS);
  return addMonthsLagos(first, n);
}

export function formatRunWhen(date: Date) {
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}
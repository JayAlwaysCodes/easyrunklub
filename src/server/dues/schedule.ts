// Pure date helpers for the monthly dues cycle (no database access).

/** Adds whole months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const daysInMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInMonth));
  return result;
}

/**
 * Every dues date that has already arrived. The first is one month after
 * the member's start date (activation covers the first month).
 */
export function duePeriodStarts(
  start: Date,
  now: Date,
  maxPeriods = 120
): Date[] {
  const dates: Date[] = [];
  for (let k = 1; k <= maxPeriods; k++) {
    const date = addMonths(start, k);
    if (date > now) break;
    dates.push(date);
  }
  return dates;
}

/** The next dues date that hasn't arrived yet. */
export function nextDueDate(start: Date, now: Date): Date {
  let k = 1;
  while (addMonths(start, k) <= now && k < 1200) k++;
  return addMonths(start, k);
}
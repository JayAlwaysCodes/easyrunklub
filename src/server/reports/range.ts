const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-23" in Lagos time.
export function lagosDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Midnight (Lagos) at the start of a YYYY-MM-DD date, or null if invalid.
function parseDay(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d) - 60 * 60 * 1000);
  return lagosDateString(date) === value ? date : null;
}

// Turns ?from=&to= into a safe range. "end" is exclusive (start of the day after "to").
export function resolveRange(from?: string, to?: string) {
  const today = lagosDateString(new Date());
  const [year, month] = today.split("-");

  let fromStr = parseDay(from) ? (from as string) : `${year}-${month}-01`;
  let toStr = parseDay(to) ? (to as string) : today;
  if (fromStr > toStr) [fromStr, toStr] = [toStr, fromStr];

  const start = parseDay(fromStr) as Date;
  const end = new Date((parseDay(toStr) as Date).getTime() + DAY_MS);
  return { fromStr, toStr, start, end, today };
}
import { prisma } from "@/server/db/prisma";
import { occurrenceDate } from "@/lib/run-time";

const HORIZON_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_OCCURRENCES = 400;

// Makes sure every repeating series has its real runs created for the
// next 90 days. Safe to call any time: existing dates are skipped.
export async function generateOccurrences(onlySeriesId?: string) {
  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_DAYS * DAY_MS);

  const seriesList = await prisma.runSeries.findMany({
    where: {
      ...(onlySeriesId ? { id: onlySeriesId } : {}),
      OR: [{ endsOn: null }, { endsOn: { gte: now } }],
    },
  });

  for (const series of seriesList) {
    const limit = series.endsOn && series.endsOn < horizon ? series.endsOn : horizon;
    const rows = [];

    for (let n = 0; n < MAX_OCCURRENCES; n++) {
      const startsAt = occurrenceDate(series.firstRunAt, series.frequency, n);
      if (startsAt > limit) break;
      rows.push({
        seriesId: series.id,
        startsAt,
        title: series.title,
        description: series.description,
        location: series.location,
        capacity: series.capacity,
        flyerPath: series.flyerPath,
        guestsAllowed: series.guestsAllowed,
        maxGuestsPerMember: series.maxGuestsPerMember,
      });
    }

    if (rows.length > 0) {
      await prisma.run.createMany({ data: rows, skipDuplicates: true });
    }
  }
}
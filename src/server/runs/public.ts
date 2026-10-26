import { prisma } from "@/server/db/prisma";

// The runs visitors see on the public site: upcoming and not cancelled.
// A repeating run appears once, as its next date.
export async function getPublicUpcomingRuns(limit: number) {
  const runs = await prisma.run.findMany({
    where: { status: "SCHEDULED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: { series: { select: { frequency: true } } },
  });

  const seenSeries = new Set<string>();
  const result: typeof runs = [];

  for (const run of runs) {
    if (run.seriesId) {
      if (seenSeries.has(run.seriesId)) continue;
      seenSeries.add(run.seriesId);
    }
    result.push(run);
    if (result.length >= limit) break;
  }
  return result;
}
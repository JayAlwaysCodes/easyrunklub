import { prisma } from "@/server/db/prisma";

export type RunCount = { going: number; guests: number; headcount: number };
export const NO_COUNT: RunCount = { going: 0, guests: 0, headcount: 0 };

// "headcount" = members going + their guests. It's what capacity limits.
export async function getHeadcounts(runIds: string[]) {
  const map = new Map<string, RunCount>();
  if (runIds.length === 0) return map;

  const groups = await prisma.runRsvp.groupBy({
    by: ["runId"],
    where: { runId: { in: runIds } },
    _count: { _all: true },
    _sum: { guests: true },
  });

  for (const group of groups) {
    const guests = group._sum.guests ?? 0;
    map.set(group.runId, {
      going: group._count._all,
      guests,
      headcount: group._count._all + guests,
    });
  }
  return map;
}
import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import { duePeriodStarts } from "@/server/dues/schedule";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Brings one member's dues up to date:
 *  1. creates any monthly charges that have come due,
 *  2. sets the membership to LAPSED if a charge is unpaid past the grace
 *     period, or back to ACTIVE once nothing is overdue.
 * Safe to call as often as you like. Call it whenever a member's dues
 * or status is about to be shown, and after any dues payment.
 */
export async function syncMembershipDues(userId: string) {
  const [membership, settings] = await Promise.all([
    prisma.membership.findUnique({ where: { userId } }),
    getClubSettings(),
  ]);

  // Only activated members owe dues.
  if (!membership?.startDate) return;
  if (membership.status !== "ACTIVE" && membership.status !== "LAPSED") return;

  const now = new Date();

  if (settings.monthlyDuesKobo > 0) {
    const dates = duePeriodStarts(membership.startDate, now);
    if (dates.length > 0) {
      await prisma.duesCharge.createMany({
        data: dates.map((date) => ({
          userId,
          periodStart: date,
          dueDate: date,
          amount: settings.monthlyDuesKobo,
        })),
        skipDuplicates: true, // @@unique([userId, periodStart])
      });
    }
  }

  const graceCutoff = new Date(now.getTime() - settings.duesGraceDays * DAY_MS);
  const overdueCount = await prisma.duesCharge.count({
    where: { userId, status: "DUE", dueDate: { lt: graceCutoff } },
  });

  const target = overdueCount > 0 ? "LAPSED" : "ACTIVE";
  if (target !== membership.status) {
    await prisma.membership.updateMany({
      where: { userId, status: membership.status },
      data: { status: target },
    });
  }
}
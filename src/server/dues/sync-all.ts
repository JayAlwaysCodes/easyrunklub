import { prisma } from "@/server/db/prisma";
import { syncMembershipDues } from "@/server/dues/sync";

// Brings every active or lapsed member's dues and status up to date.
// Used by the admin "Refresh all dues" button, and later by the daily job.
export async function syncAllMemberDues() {
  const memberships = await prisma.membership.findMany({
    where: { status: { in: ["ACTIVE", "LAPSED"] } },
    select: { userId: true },
  });

  let failed = 0;
  for (const { userId } of memberships) {
    try {
      await syncMembershipDues(userId);
    } catch (error) {
      failed += 1;
      console.error("syncMembershipDues failed for", userId, error);
    }
  }

  return { checked: memberships.length, failed };
}
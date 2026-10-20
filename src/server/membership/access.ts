import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { syncMembershipDues } from "@/server/dues/sync";

/**
 * Call at the top of any page (or server action) that is for active
 * members only. Sends everyone else somewhere helpful:
 *   LAPSED  -> the dues page
 *   others  -> the Overview (activation prompt for pending members)
 * Admins always pass.
 */
export async function requireActiveMember() {
  const session = await auth();
  if (!session?.user) redirect("/?auth=login");

  const userId = session.user.id;
  if (session.user.role === "ADMIN") return { userId };

  // Make sure the status is current before deciding.
  await syncMembershipDues(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (membership?.status === "ACTIVE") return { userId };
  if (membership?.status === "LAPSED") redirect("/dashboard/dues");
  redirect("/dashboard");
}
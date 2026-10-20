import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

/**
 * Call at the start of every admin server action. Throws if the caller
 * isn't a current admin. Pages are also protected by the admin layout,
 * but actions can be called directly, so they must check for themselves.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Not authorized");

  return { userId: user.id };
}
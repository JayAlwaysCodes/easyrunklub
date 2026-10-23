import type { Role } from "@prisma/client";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

// The role as stored in the database right now (not the login token, which
// can be out of date after a promotion or removal).
export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role ?? null;
}
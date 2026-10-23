import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

async function currentStaff() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return { userId: session.user.id, role: user?.role };
}

// Any admin (regular or Master).
export async function requireAdmin() {
  const { userId, role } = await currentStaff();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Not authorized");
  }
  return { userId, role };
}

// Master Admin only: settings, fees, and managing other admins.
export async function requireSuperAdmin() {
  const { userId, role } = await currentStaff();
  if (role !== "SUPER_ADMIN") throw new Error("Not authorized");
  return { userId, role };
}
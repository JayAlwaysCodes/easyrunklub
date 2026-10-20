import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export async function logAudit(entry: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (error) {
    // A logging failure must never undo the admin's action.
    console.error("Failed to write audit log:", error);
  }
}
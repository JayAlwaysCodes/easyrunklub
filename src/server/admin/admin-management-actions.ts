"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { addAdminSchema } from "@/validators/admin-management";
import type { AdminActionState } from "@/server/admin/member-actions";

const NOT_ALLOWED = "Only the Master Admin can do this.";

async function superAdminId() {
  try {
    return (await requireSuperAdmin()).userId;
  } catch {
    return null;
  }
}

// Promote an existing member account to admin.
export async function addAdmin(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actorId = await superAdminId();
  if (!actorId) return { error: NOT_ALLOWED };

  const parsed = addAdminSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the email." };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  if (!user) {
    return { error: "No account with that email. They need to register on the site first." };
  }
  if (user.role !== "MEMBER") {
    return { error: "That person is already an admin." };
  }
  if (!user.emailVerified) {
    return {
      error:
        "Their email isn't verified yet. Open their member page and use “Resend verification email” first.",
    };
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });

  await logAudit({
    actorId,
    action: "admin.add",
    targetType: "member",
    targetId: user.id,
    details: { summary: `${user.name ?? user.email} was made an admin` },
  });

  revalidatePath("/admin/dashboard/admins");
  return {
    success: `${user.name ?? user.email} is now an admin. They need to sign out and back in once.`,
  };
}

// Turn a regular admin back into an ordinary member.
export async function removeAdmin(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actorId = await superAdminId();
  if (!actorId) return { error: NOT_ALLOWED };

  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      membership: { select: { userId: true } },
    },
  });

  if (!target) return { error: "Account not found." };
  if (target.role !== "ADMIN") {
    return { error: "Only regular admins can be removed here." };
  }
  if (!target.membership) {
    return {
      error:
        "This account has no membership, so it can't be turned back into a member.",
    };
  }

  await prisma.user.update({ where: { id: userId }, data: { role: "MEMBER" } });

  await logAudit({
    actorId,
    action: "admin.remove",
    targetType: "member",
    targetId: userId,
    details: { summary: `${target.name ?? target.email} is no longer an admin` },
  });

  revalidatePath("/admin/dashboard/admins");
  return { success: `${target.name ?? target.email} is now a regular member.` };
}
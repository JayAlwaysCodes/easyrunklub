"use server";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { issueVerificationEmail } from "@/server/auth/verification-token";
import type { AdminActionState } from "@/server/admin/member-actions";

export async function resendVerificationEmail(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  let adminId: string;
  try {
    adminId = (await requireAdmin()).userId;
  } catch {
    return { error: "You don't have permission to do this." };
  }

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Member not found." };

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!member) return { error: "Member not found." };
  if (member.emailVerified) {
    return { error: "This member's email is already verified." };
  }

  try {
    await issueVerificationEmail(member.email);
  } catch (error) {
    console.error("resendVerificationEmail failed:", error);
    return { error: "Couldn't send the email. Please try again." };
  }

  await logAudit({
    actorId: adminId,
    action: "member.resend_verification",
    targetType: "member",
    targetId: userId,
    details: { summary: `Verification email re-sent to ${member.email}` },
  });

  return { success: `Verification email sent to ${member.email}.` };
}
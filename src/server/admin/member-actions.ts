"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { getClubSettings } from "@/server/settings";
import { syncMembershipDues } from "@/server/dues/sync";
import { formatNaira } from "@/lib/format";
import {
  manualActivationSchema,
  markPaidSchema,
  statusChangeSchema,
  waiveSchema,
} from "@/validators/member-admin";

export type AdminActionState = { error?: string; success?: string };

class AlreadyChangedError extends Error {}

const NO_PERMISSION = "You don't have permission to do this.";

async function currentAdminId() {
  try {
    return (await requireAdmin()).userId;
  } catch {
    return null;
  }
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

// Pending member paid the activation fee in cash or by transfer.
export async function activateManually(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const parsed = manualActivationSchema.safeParse({
    userId: formData.get("userId"),
    method: formData.get("method"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { userId, method, note } = parsed.data;

  const member = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true, wallet: true },
  });
  if (!member || member.role !== "MEMBER" || !member.membership || !member.wallet) {
    return { error: "Member not found." };
  }
  if (member.membership.status !== "PENDING") {
    return { error: "Only pending accounts can be activated this way." };
  }

  const { activationFeeKobo } = await getClubSettings();

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.membership.updateMany({
        where: { userId, status: "PENDING" },
        data: { status: "ACTIVE", startDate: new Date() },
      });
      if (claimed.count === 0) throw new AlreadyChangedError();

      await tx.transaction.create({
        data: {
          walletId: member.wallet!.id,
          type: "PAYMENT",
          status: "COMPLETED",
          purpose: "ACTIVATION",
          amount: activationFeeKobo,
          currency: "NGN",
          provider: "manual",
          providerReference: `ERK-MAN-${randomUUID()}`,
          metadata: { method, note, recordedBy: adminId },
          description: `Membership activation fee (${method})`,
        },
      });
    });
  } catch (error) {
    if (error instanceof AlreadyChangedError) {
      return { error: "This account was just changed by someone else. Refresh the page." };
    }
    console.error("activateManually failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  await logAudit({
    actorId: adminId,
    action: "member.activate_manual",
    targetType: "member",
    targetId: userId,
    details: {
      summary: `Activated after ${method} payment of ${formatNaira(activationFeeKobo)}${note ? `. Note: ${note}` : ""}`,
    },
  });

  revalidatePath(`/admin/dashboard/members/${userId}`);
  return { success: "Member activated and payment recorded." };
}

export async function setMembershipStatus(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const parsed = statusChangeSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { userId, status, reason } = parsed.data;

  const member = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });
  if (!member || member.role !== "MEMBER" || !member.membership) {
    return { error: "Member not found." };
  }

  const before = member.membership.status;
  if (before === status) return { error: "The member already has that status." };
  if (before === "PENDING" && status === "ACTIVE") {
    return {
      error:
        "To activate a pending member, use “Record payment & activate” so the fee is recorded.",
    };
  }

  await prisma.membership.update({
    where: { userId },
    data: {
      status,
      ...(status === "ACTIVE" && !member.membership.startDate
        ? { startDate: new Date() }
        : {}),
    },
  });

  // If restoring an Active member who still owes overdue months,
  // the dues check puts them straight back to Lapsed.
  let note = "";
  if (status === "ACTIVE") {
    await syncMembershipDues(userId);
    const after = await prisma.membership.findUnique({
      where: { userId },
      select: { status: true },
    });
    if (after?.status === "LAPSED") {
      note =
        " They still have overdue dues, so they show as Lapsed. Mark those months paid or waive them.";
    }
  }

  await logAudit({
    actorId: adminId,
    action: "member.status_change",
    targetType: "member",
    targetId: userId,
    details: { summary: `${before} → ${status}. Reason: ${reason}` },
  });

  revalidatePath(`/admin/dashboard/members/${userId}`);
  return { success: `Status changed to ${status.toLowerCase()}.${note}` };
}

export async function markDuesPaid(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const parsed = markPaidSchema.safeParse({
    chargeId: formData.get("chargeId"),
    method: formData.get("method"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { chargeId, method, note } = parsed.data;

  const charge = await prisma.duesCharge.findUnique({
    where: { id: chargeId },
    include: { user: { include: { wallet: true } } },
  });
  if (!charge || charge.status !== "DUE" || !charge.user.wallet) {
    return { error: "These dues are no longer outstanding." };
  }
  const walletId = charge.user.wallet.id;
  const label = monthLabel(charge.periodStart);

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.duesCharge.updateMany({
        where: { id: chargeId, status: "DUE" },
        data: { status: "PAID", paidAt: new Date(), paidVia: "admin" },
      });
      if (claimed.count === 0) throw new AlreadyChangedError();

      const receipt = await tx.transaction.create({
        data: {
          walletId,
          type: "PAYMENT",
          status: "COMPLETED",
          purpose: "DUES",
          amount: charge.amount,
          currency: "NGN",
          provider: "manual",
          providerReference: `ERK-MAN-${randomUUID()}`,
          metadata: { method, note, recordedBy: adminId, duesChargeId: chargeId },
          description: `Monthly dues – ${label} (${method})`,
        },
      });

      await tx.duesCharge.update({
        where: { id: chargeId },
        data: { transactionId: receipt.id },
      });
    });
  } catch (error) {
    if (error instanceof AlreadyChangedError) {
      return { error: "Someone else just updated these dues. Refresh the page." };
    }
    console.error("markDuesPaid failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  await syncMembershipDues(charge.userId);

  await logAudit({
    actorId: adminId,
    action: "dues.mark_paid",
    targetType: "member",
    targetId: charge.userId,
    details: {
      summary: `${label} dues (${formatNaira(charge.amount)}) marked paid by ${method}${note ? `. Note: ${note}` : ""}`,
    },
  });

  revalidatePath(`/admin/dashboard/members/${charge.userId}`);
  return { success: `${label} marked as paid.` };
}

export async function waiveDues(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const parsed = waiveSchema.safeParse({
    chargeId: formData.get("chargeId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { chargeId, reason } = parsed.data;

  const charge = await prisma.duesCharge.findUnique({ where: { id: chargeId } });
  if (!charge || charge.status !== "DUE") {
    return { error: "These dues are no longer outstanding." };
  }
  const label = monthLabel(charge.periodStart);

  const waived = await prisma.duesCharge.updateMany({
    where: { id: chargeId, status: "DUE" },
    data: { status: "WAIVED" },
  });
  if (waived.count === 0) {
    return { error: "Someone else just updated these dues. Refresh the page." };
  }

  await syncMembershipDues(charge.userId);

  await logAudit({
    actorId: adminId,
    action: "dues.waive",
    targetType: "member",
    targetId: charge.userId,
    details: {
      summary: `${label} dues (${formatNaira(charge.amount)}) waived. Reason: ${reason}`,
    },
  });

  revalidatePath(`/admin/dashboard/members/${charge.userId}`);
  return { success: `${label} dues waived.` };
}
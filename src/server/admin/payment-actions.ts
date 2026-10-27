"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { processPayment } from "@/server/payments/process-payment";
import { formatNaira } from "@/lib/format";
import type { AdminActionState } from "@/server/admin/member-actions";

const NO_PERMISSION = "You don't have permission to do this.";
const MIN_REJECT_AGE_MS = 30 * 60 * 1000;

async function currentAdminId() {
  try {
    return (await requireAdmin()).userId;
  } catch {
    return null;
  }
}

function loadTransaction(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: { wallet: { include: { user: { select: { id: true } } } } },
  });
}

function refresh(id: string) {
  revalidatePath("/admin/dashboard/payments");
  revalidatePath(`/admin/dashboard/payments/${id}`);
  revalidatePath("/admin/dashboard/dues");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard/dues");
}

export async function recheckPayment(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const id = String(formData.get("transactionId") ?? "");
  const tx = await loadTransaction(id);
  if (!tx) return { error: "Payment not found." };
  if (tx.provider !== "paystack" || !tx.providerReference) {
    return { error: "Only Paystack payments can be re-checked." };
  }
  if (tx.status !== "PENDING") {
    return { error: `This payment is already ${tx.status.toLowerCase()}.` };
  }

  await processPayment(tx.providerReference);

  const after = await prisma.transaction.findUnique({
    where: { id },
    select: { status: true },
  });

  await logAudit({
    actorId: adminId,
    action: "payment.recheck",
    targetType: "member",
    targetId: tx.wallet.user.id,
    details: {
      summary: `Re-checked ${formatNaira(tx.amount)} payment (${tx.providerReference}): now ${after?.status ?? "unknown"}`,
    },
  });
  refresh(id);

  if (after?.status === "COMPLETED") {
    return { success: "Paystack confirmed the payment and it has been applied." };
  }
  if (after?.status === "FAILED") {
    return { success: "Paystack says this payment didn't succeed. It's now marked as failed." };
  }
  return {
    error:
      "Paystack couldn't give a final answer yet (the payment may still be in progress, or Paystack couldn't be reached). Try again in a few minutes.",
  };
}

export async function rejectPayment(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const adminId = await currentAdminId();
  if (!adminId) return { error: NO_PERMISSION };

  const id = String(formData.get("transactionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { error: "Please give a short reason (at least 3 characters)." };
  if (reason.length > 200) return { error: "Keep the reason under 200 characters." };

  const tx = await loadTransaction(id);
  if (!tx) return { error: "Payment not found." };
  if (tx.status !== "PENDING") {
    return { error: `This payment is already ${tx.status.toLowerCase()}.` };
  }
  if (Date.now() - tx.createdAt.getTime() < MIN_REJECT_AGE_MS) {
    return {
      error:
        "This payment is less than 30 minutes old and the member may still be paying. Wait a while, or use Re-check.",
    };
  }

  // Never reject something Paystack actually charged: ask Paystack first.
  if (tx.provider === "paystack" && tx.providerReference) {
    const routed = await processPayment(tx.providerReference);
    const after = await prisma.transaction.findUnique({
      where: { id },
      select: { status: true },
    });

    if (after?.status === "COMPLETED") {
      refresh(id);
      return { success: "Paystack confirms this payment succeeded, so it was applied instead of rejected." };
    }
    if (after?.status === "FAILED") {
      refresh(id);
      return { success: "Paystack reports this payment failed, so it is marked as failed." };
    }

    const result =
      routed.kind === "unknown" ? "" : (routed.outcome as { result?: string }).result;
    if (result === "verification_failed") {
      return {
        error: "Couldn't reach Paystack to confirm, so nothing was rejected. Please try again shortly.",
      };
    }
  }

  const previous =
    tx.metadata && typeof tx.metadata === "object" && !Array.isArray(tx.metadata)
      ? (tx.metadata as Prisma.JsonObject)
      : {};

  const updated = await prisma.transaction.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: "FAILED",
      metadata: { ...previous, rejectedBy: adminId, rejectReason: reason } as Prisma.InputJsonObject,
    },
  });
  if (updated.count === 0) {
    return { error: "Someone else just updated this payment. Refresh the page." };
  }

  await logAudit({
    actorId: adminId,
    action: "payment.reject",
    targetType: "member",
    targetId: tx.wallet.user.id,
    details: {
      summary: `Rejected ${formatNaira(tx.amount)} payment (${tx.providerReference ?? tx.id}). Reason: ${reason}`,
    },
  });
  refresh(id);
  return { success: "Payment marked as failed." };
}
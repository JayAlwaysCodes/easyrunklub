"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { syncMembershipDues } from "@/server/dues/sync";
import { formatNaira } from "@/lib/format";

export type DuesActionState = { error?: string; success?: string };

class InsufficientFundsError extends Error {}
class AlreadyPaidError extends Error {}

// Pays one month's dues out of the member's wallet balance.
export async function payDuesFromWallet(
  _prev: DuesActionState,
  formData: FormData
): Promise<DuesActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Please log in again." };
  const userId = session.user.id;

  const chargeId = String(formData.get("chargeId") ?? "");
  const charge = await prisma.duesCharge.findFirst({
    where: { id: chargeId, userId },
  });
  if (!charge || charge.status !== "DUE") {
    return { error: "This payment is no longer due." };
  }

  // The oldest unpaid month goes first.
  const older = await prisma.duesCharge.count({
    where: { userId, status: "DUE", periodStart: { lt: charge.periodStart } },
  });
  if (older > 0) {
    return { error: "Please pay your oldest unpaid month first." };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { error: "No wallet found for this account." };

  const monthLabel = charge.periodStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  try {
    // One transaction: the debit, the charge update and the receipt row
    // all succeed together or not at all.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.duesCharge.updateMany({
        where: { id: charge.id, status: "DUE" },
        data: { status: "PAID", paidAt: new Date(), paidVia: "wallet" },
      });
      if (claimed.count === 0) throw new AlreadyPaidError();

      // Only debits if the balance covers it, atomically.
      const debited = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: charge.amount } },
        data: { balance: { decrement: charge.amount } },
      });
      if (debited.count === 0) throw new InsufficientFundsError();

      const receipt = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYMENT",
          status: "COMPLETED",
          purpose: "DUES",
          amount: charge.amount,
          currency: "NGN",
          provider: "wallet",
          providerReference: `ERK-DUES-${randomUUID()}`,
          description: `Monthly dues – ${monthLabel}`,
        },
      });

      await tx.duesCharge.update({
        where: { id: charge.id },
        data: { transactionId: receipt.id },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      return {
        error: `Your wallet balance is below ${formatNaira(charge.amount)}. Top up and try again.`,
      };
    }
    if (error instanceof AlreadyPaidError) {
      return { error: "This payment has already been made." };
    }
    console.error("payDuesFromWallet failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  // Paying the last overdue month brings the member back to ACTIVE.
  await syncMembershipDues(userId);

  revalidatePath("/dashboard", "layout");
  return { success: `Dues for ${monthLabel} paid.` };
}
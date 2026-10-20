import { prisma } from "@/server/db/prisma";
import { verifyTransaction } from "@/server/payments/paystack";
import { syncMembershipDues } from "@/server/dues/sync";

export type DuesPaymentOutcome =
  | { result: "paid"; creditKobo: number }
  | { result: "underpaid"; paidKobo: number; expectedKobo: number }
  | { result: "credited_to_wallet"; paidKobo: number } // charge was no longer due
  | { result: "already_processed" }
  | { result: "not_successful" }
  | { result: "not_found" }
  | { result: "verification_failed" };

// Confirms a card payment for one month's dues.
// - Exact or over-payment: the charge is marked PAID and any excess goes to
//   the member's wallet.
// - Underpayment: the money goes to the wallet and the charge stays DUE.
// - If the charge was already paid some other way, the money goes to the wallet.
export async function processDuesPayment(
  reference: string
): Promise<DuesPaymentOutcome> {
  const transaction = await prisma.transaction.findFirst({
    where: { provider: "paystack", providerReference: reference },
    include: { wallet: { select: { userId: true } } },
  });

  if (!transaction || transaction.purpose !== "DUES") {
    return { result: "not_found" };
  }
  if (transaction.status === "COMPLETED") {
    return { result: "already_processed" };
  }

  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch (error) {
    console.error("Paystack verify failed for dues payment:", reference, error);
    return { result: "verification_failed" };
  }

  if (verification.status !== "success") {
    if (verification.status === "failed") {
      await prisma.transaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
    return { result: "not_successful" };
  }

  const paidKobo = verification.amount;
  const userId = transaction.wallet.userId;
  const chargeId = (
    transaction.metadata as { duesChargeId?: string } | null
  )?.duesChargeId;

  const outcome = await prisma.$transaction(
    async (tx): Promise<DuesPaymentOutcome> => {
      // Atomically claim this transaction (callback vs webhook race).
      const claimed = await tx.transaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: {
          status: "COMPLETED",
          amount: paidKobo,
          metadata: { duesChargeId: chargeId ?? null, paidKobo },
        },
      });
      if (claimed.count === 0) return { result: "already_processed" };

      const charge = chargeId
        ? await tx.duesCharge.findUnique({ where: { id: chargeId } })
        : null;

      // Charge missing or already settled: keep the money as wallet credit.
      if (!charge || charge.status !== "DUE") {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: paidKobo } },
        });
        return { result: "credited_to_wallet", paidKobo };
      }

      // Underpaid: credit the wallet, leave the charge DUE.
      if (paidKobo < charge.amount) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: paidKobo } },
        });
        return {
          result: "underpaid",
          paidKobo,
          expectedKobo: charge.amount,
        };
      }

      const settled = await tx.duesCharge.updateMany({
        where: { id: charge.id, status: "DUE" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidVia: "paystack",
          transactionId: transaction.id,
        },
      });

      // Lost a race with another payment: keep everything as wallet credit.
      if (settled.count === 0) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: paidKobo } },
        });
        return { result: "credited_to_wallet", paidKobo };
      }

      const creditKobo = paidKobo - charge.amount;
      if (creditKobo > 0) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: creditKobo } },
        });
      }
      return { result: "paid", creditKobo };
    }
  );

  // Paying the last overdue month brings the member back to ACTIVE.
  // Failure here is harmless: the next page load re-runs the same check.
  try {
    await syncMembershipDues(userId);
  } catch (error) {
    console.error("syncMembershipDues after dues payment failed:", error);
  }

  return outcome;
}
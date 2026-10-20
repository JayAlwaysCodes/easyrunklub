import { prisma } from "@/server/db/prisma";
import { verifyTransaction } from "@/server/payments/paystack";

export type PaymentOutcome =
  | { result: "activated"; excessKobo: number }
  | { result: "underpaid"; paidKobo: number; expectedKobo: number }
  | { result: "already_processed" }
  | { result: "not_successful" }
  | { result: "not_found" }
  | { result: "verification_failed" };

// Single code path for confirming an activation payment. Both the browser
// callback page and the Paystack webhook call this, so whichever arrives
// first does the work and the other safely becomes a no-op.
//
// Transactions carry a `purpose`. This function only handles activation
// payments (older rows have a null purpose and are treated as activation).
// Top-ups and dues will get their own handlers, and the callback and
// webhook will route by purpose.
export async function processActivationPayment(
  reference: string
): Promise<PaymentOutcome> {
  const transaction = await prisma.transaction.findFirst({
    where: { provider: "paystack", providerReference: reference },
    include: { wallet: { select: { userId: true } } },
  });

  if (!transaction) return { result: "not_found" };

  // Not an activation payment: leave it for its own handler.
  if (transaction.purpose && transaction.purpose !== "ACTIVATION") {
    return { result: "not_found" };
  }

  if (transaction.status === "COMPLETED") {
    return { result: "already_processed" };
  }

  // Never trust the redirect or the webhook body alone: ask Paystack directly.
  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch {
    return { result: "verification_failed" };
  }

  if (verification.status !== "success") {
    // Only a definite failure is recorded as FAILED. An "abandoned" payment
    // stays PENDING because the user may still complete it.
    if (verification.status === "failed") {
      await prisma.transaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
    return { result: "not_successful" };
  }

  // Expected amount is the fee frozen on the row at checkout time.
  const expectedKobo = transaction.amount;
  const paidKobo = verification.amount;
  const userId = transaction.wallet.userId;

  return prisma.$transaction(async (tx): Promise<PaymentOutcome> => {
    // Atomically claim this transaction. If the callback and the webhook
    // arrive together, only one of them can flip PENDING -> COMPLETED;
    // the other gets count 0 and stops here.
    const claimed = await tx.transaction.updateMany({
      where: { id: transaction.id, status: "PENDING" },
      data: {
        status: "COMPLETED",
        amount: paidKobo,
        metadata: { expectedKobo, paidKobo },
      },
    });
    if (claimed.count === 0) return { result: "already_processed" };

    // Underpaid: keep the money as wallet credit, but don't activate.
    if (paidKobo < expectedKobo) {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: paidKobo } },
      });
      return { result: "underpaid", paidKobo, expectedKobo };
    }

    // Only activate if not already active (e.g. the user paid twice from
    // two tabs). In that case the whole payment becomes wallet credit.
    const activation = await tx.membership.updateMany({
      where: { userId, status: { not: "ACTIVE" } },
      data: { status: "ACTIVE", startDate: new Date() },
    });

    const creditKobo =
      activation.count === 0 ? paidKobo : paidKobo - expectedKobo;

    if (creditKobo > 0) {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: creditKobo } },
      });
    }

    return { result: "activated", excessKobo: creditKobo };
  });
}
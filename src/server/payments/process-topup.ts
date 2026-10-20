import { prisma } from "@/server/db/prisma";
import { verifyTransaction } from "@/server/payments/paystack";

export type TopUpOutcome =
  | { result: "credited"; amountKobo: number }
  | { result: "already_processed" }
  | { result: "not_successful" }
  | { result: "not_found" }
  | { result: "verification_failed" };

// Confirms a wallet top-up. Same safety rules as activation: ask Paystack
// directly, and atomically claim the transaction so the browser callback
// and the webhook can never both credit the wallet.
export async function processTopUpPayment(
  reference: string
): Promise<TopUpOutcome> {
  const transaction = await prisma.transaction.findFirst({
    where: { provider: "paystack", providerReference: reference },
    include: { wallet: { select: { userId: true } } },
  });

  if (!transaction || transaction.purpose !== "TOPUP") {
    return { result: "not_found" };
  }
  if (transaction.status === "COMPLETED") {
    return { result: "already_processed" };
  }

  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch {
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

  return prisma.$transaction(async (tx): Promise<TopUpOutcome> => {
    const claimed = await tx.transaction.updateMany({
      where: { id: transaction.id, status: "PENDING" },
      data: {
        status: "COMPLETED",
        amount: paidKobo,
        metadata: { requestedKobo: transaction.amount, paidKobo },
      },
    });
    if (claimed.count === 0) return { result: "already_processed" };

    await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: paidKobo } },
    });

    return { result: "credited", amountKobo: paidKobo };
  });
}
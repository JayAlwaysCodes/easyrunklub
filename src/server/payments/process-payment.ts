import { prisma } from "@/server/db/prisma";
import {
  processActivationPayment,
  type PaymentOutcome,
} from "@/server/payments/process-activation";
import {
  processTopUpPayment,
  type TopUpOutcome,
} from "@/server/payments/process-topup";
import {
  processDuesPayment,
  type DuesPaymentOutcome,
} from "@/server/payments/process-dues";

export type RoutedPayment =
  | { kind: "activation"; outcome: PaymentOutcome }
  | { kind: "topup"; outcome: TopUpOutcome }
  | { kind: "dues"; outcome: DuesPaymentOutcome }
  | { kind: "unknown" };

export async function processPayment(
  reference: string
): Promise<RoutedPayment> {
  const transaction = await prisma.transaction.findFirst({
    where: { provider: "paystack", providerReference: reference },
    select: { purpose: true },
  });

  if (!transaction) return { kind: "unknown" };

  switch (transaction.purpose) {
    case "TOPUP":
      return { kind: "topup", outcome: await processTopUpPayment(reference) };
    case "DUES":
      return { kind: "dues", outcome: await processDuesPayment(reference) };
    case "ACTIVATION":
    case null: // older rows from before `purpose` existed
      return {
        kind: "activation",
        outcome: await processActivationPayment(reference),
      };
    default:
      return { kind: "unknown" };
  }
}
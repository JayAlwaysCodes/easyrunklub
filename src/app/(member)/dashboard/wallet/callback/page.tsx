import Link from "next/link";

import { Button } from "@/components/ui/button";
import { processTopUpPayment } from "@/server/payments/process-topup";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TopUpCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  let title = "Something went wrong";
  let message = "We couldn't find that payment.";

  if (reference) {
    const outcome = await processTopUpPayment(reference);

    switch (outcome.result) {
      case "credited":
        title = "Top-up successful";
        message = `${formatNaira(outcome.amountKobo)} has been added to your wallet.`;
        break;
      case "already_processed":
        title = "Already added";
        message = "This top-up has already been added to your wallet.";
        break;
      case "not_successful":
        title = "Payment not completed";
        message = "Your payment wasn't completed, so nothing was added.";
        break;
      case "verification_failed":
        title = "We're confirming your payment";
        message =
          "We couldn't confirm it just yet. If you were charged, your balance will update shortly.";
        break;
      default:
        break;
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border p-8 text-center">
      <h1 className="font-heading text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button
        asChild
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        <Link href="/dashboard/wallet">Back to Wallet</Link>
      </Button>
    </div>
  );
}
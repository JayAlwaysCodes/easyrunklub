import Link from "next/link";

import { Button } from "@/components/ui/button";
import { processDuesPayment } from "@/server/payments/process-dues";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DuesCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  let title = "Something went wrong";
  let message = "We couldn't find that payment.";

  if (reference) {
    const outcome = await processDuesPayment(reference);

    switch (outcome.result) {
      case "paid":
        title = "Dues paid";
        message =
          outcome.creditKobo > 0
            ? `Thank you! ${formatNaira(outcome.creditKobo)} extra was added to your wallet.`
            : "Thank you! Your monthly dues are paid.";
        break;
      case "underpaid":
        title = "Payment received, dues not cleared";
        message = `You paid ${formatNaira(outcome.paidKobo)}, but the dues are ${formatNaira(outcome.expectedKobo)}. The amount was added to your wallet so you can complete the payment.`;
        break;
      case "credited_to_wallet":
        title = "Added to your wallet";
        message = `${formatNaira(outcome.paidKobo)} was added to your wallet because those dues were already settled.`;
        break;
      case "already_processed":
        title = "Already recorded";
        message = "This payment has already been recorded.";
        break;
      case "not_successful":
        title = "Payment not completed";
        message = "Your payment wasn't completed, so nothing was charged.";
        break;
      case "verification_failed":
        title = "We're confirming your payment";
        message =
          "We couldn't confirm it just yet. If you were charged, your dues will update shortly.";
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
        <Link href="/dashboard/dues">Back to Dues</Link>
      </Button>
    </div>
  );
}
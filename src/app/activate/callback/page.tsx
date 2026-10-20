import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { processActivationPayment } from "@/server/payments/process-activation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default async function ActivationCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const { reference } = await searchParams;

  if (!reference) {
    return (
      <ResultCard
        title="Something went wrong"
        message="No payment reference was provided. If you completed a payment, please contact support."
      />
    );
  }

  const outcome = await processActivationPayment(reference);

  switch (outcome.result) {
    case "activated":
      return (
        <ResultCard
          title="Account activated!"
          message="Your membership is now active. Welcome to Easy Run Klub!"
          success
        />
      );
    case "already_processed":
      return (
        <ResultCard
          title="Payment already processed"
          message="This payment has already been confirmed. If your membership is active, you're all set."
          success
        />
      );
    case "underpaid":
      return (
        <ResultCard
          title="Payment received, but it's less than the activation fee"
          message="We've credited what you paid to your wallet, but your membership is still pending. Top up the difference to activate."
        />
      );
    case "not_successful":
      return (
        <ResultCard
          title="Payment not successful"
          message="Your payment was not completed. You can try activating again from your dashboard."
        />
      );
    case "not_found":
      return (
        <ResultCard
          title="Transaction not found"
          message="We couldn't find a matching transaction. Please contact support if you were charged."
        />
      );
    default:
      return (
        <ResultCard
          title="Verification failed"
          message="We couldn't verify this payment with Paystack right now. If you were charged, your account will be updated automatically shortly, or please contact support."
        />
      );
  }
}

function ResultCard({
  title,
  message,
  success = false,
}: {
  title: string;
  message: string;
  success?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={success ? "text-brand-forest" : ""}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter>
          <Button
            asChild
            className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
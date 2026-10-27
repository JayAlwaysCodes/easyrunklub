"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recheckPayment, rejectPayment } from "@/server/admin/payment-actions";
import type { AdminActionState } from "@/server/admin/member-actions";

const initialState: AdminActionState = {};

function Feedback({ state }: { state: AdminActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-md bg-brand-mint px-3 py-2 text-sm text-brand-forest">
        {state.success}
      </p>
    );
  }
  return null;
}

export function PaymentControls({ transactionId }: { transactionId: string }) {
  const [checkState, checkAction, checking] = useActionState(recheckPayment, initialState);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectPayment, initialState);
  const busy = checking || rejecting;

  return (
    <div className="space-y-5">
      <form action={checkAction} className="space-y-2">
        <input type="hidden" name="transactionId" value={transactionId} />
        <Feedback state={checkState} />
        <p className="text-sm text-muted-foreground">
          Asks Paystack for the final result. If the member really paid, it is applied now.
        </p>
        <Button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
        >
          {checking ? "Checking with Paystack..." : "Re-check with Paystack"}
        </Button>
      </form>

      <form
        action={rejectAction}
        onSubmit={(event) => {
          if (!window.confirm("Mark this payment as failed?")) event.preventDefault();
        }}
        className="space-y-2 border-t pt-5"
      >
        <input type="hidden" name="transactionId" value={transactionId} />
        <Feedback state={rejectState} />
        <p className="text-sm text-muted-foreground">
          For payments the member abandoned. Paystack is asked first, so a payment that
          actually went through is never rejected.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input name="reason" required placeholder="Reason (required)" className="sm:max-w-sm" />
          <Button
            type="submit"
            variant="outline"
            disabled={busy}
            className="rounded-full text-destructive hover:text-destructive"
          >
            {rejecting ? "Working..." : "Mark as failed"}
          </Button>
        </div>
      </form>
    </div>
  );
}
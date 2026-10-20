"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  payDuesFromWallet,
  type DuesActionState,
} from "@/server/dues/actions";
import { startDuesCheckout } from "@/server/dues/checkout";

const initialState: DuesActionState = {};

export function PayDuesButton({
  chargeId,
  walletDisabled,
}: {
  chargeId: string;
  walletDisabled?: boolean;
}) {
  const [walletState, walletAction, walletPending] = useActionState(
    payDuesFromWallet,
    initialState
  );
  const [cardState, cardAction, cardPending] = useActionState(
    startDuesCheckout,
    initialState
  );

  const error = walletState.error ?? cardState.error;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <form action={walletAction}>
          <input type="hidden" name="chargeId" value={chargeId} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={walletDisabled || walletPending || cardPending}
            className="rounded-full"
          >
            {walletPending ? "Paying..." : "Pay from wallet"}
          </Button>
        </form>

        <form action={cardAction}>
          <input type="hidden" name="chargeId" value={chargeId} />
          <Button
            type="submit"
            size="sm"
            disabled={walletPending || cardPending}
            className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            {cardPending ? "Redirecting..." : "Pay by card"}
          </Button>
        </form>
      </div>

      {error && (
        <p role="alert" className="max-w-[260px] text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
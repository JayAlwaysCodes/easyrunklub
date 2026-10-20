"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  startTopUpCheckout,
  type PaymentActionState,
} from "@/server/payments/actions";

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000];
const initialState: PaymentActionState = {};

export function TopUpForm({
  minNaira,
  maxNaira,
}: {
  minNaira: number;
  maxNaira: number;
}) {
  const [state, formAction, isPending] = useActionState(
    startTopUpCheckout,
    initialState
  );
  const [amount, setAmount] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={minNaira}
          max={maxNaira}
          step={1}
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={`${minNaira.toLocaleString()} – ${maxNaira.toLocaleString()}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setAmount(String(value))}
          >
            ₦{value.toLocaleString()}
          </Button>
        ))}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90 sm:w-auto"
      >
        {isPending ? "Redirecting to Paystack..." : "Top Up Wallet"}
      </Button>
    </form>
  );
}
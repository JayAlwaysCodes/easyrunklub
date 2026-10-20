"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateClubSettings,
  type SettingsActionState,
} from "@/server/admin/settings-actions";

const initialState: SettingsActionState = {};

export function SettingsForm({
  defaults,
}: {
  defaults: {
    activationFeeNaira: number;
    monthlyDuesNaira: number;
    duesGraceDays: number;
  };
}) {
  const [state, formAction, isPending] = useActionState(
    updateClubSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-md bg-brand-mint px-3 py-2 text-sm text-brand-forest"
        >
          {state.success}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="activationFeeNaira">Activation fee (₦)</Label>
        <Input
          id="activationFeeNaira"
          name="activationFeeNaira"
          type="number"
          inputMode="numeric"
          min={100}
          step={1}
          required
          defaultValue={defaults.activationFeeNaira}
        />
        <p className="text-xs text-muted-foreground">
          One-time fee a new member pays to activate their account. Applies
          to new payments only.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthlyDuesNaira">Monthly dues (₦)</Label>
        <Input
          id="monthlyDuesNaira"
          name="monthlyDuesNaira"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={defaults.monthlyDuesNaira}
        />
        <p className="text-xs text-muted-foreground">
          Applies to months that haven&apos;t been charged yet. Months
          already charged keep the amount they were created with. Set to 0 to
          switch dues off.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duesGraceDays">Grace period (days)</Label>
        <Input
          id="duesGraceDays"
          name="duesGraceDays"
          type="number"
          inputMode="numeric"
          min={0}
          max={60}
          step={1}
          required
          defaultValue={defaults.duesGraceDays}
        />
        <p className="text-xs text-muted-foreground">
          Days after the due date before an unpaid member becomes Lapsed.
          This applies to everyone straight away, including members who are
          already overdue.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        {isPending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
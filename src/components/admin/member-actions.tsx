"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activateManually,
  markDuesPaid,
  setMembershipStatus,
  waiveDues,
  type AdminActionState,
} from "@/server/admin/member-actions";

const initialState: AdminActionState = {};

const selectClass =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

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

// Asks "are you sure?" before submitting; cancelling stops the submit.
function confirmSubmit(message: string) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
}

export function ManualActivationForm({
  userId,
  feeLabel,
}: {
  userId: string;
  feeLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(activateManually, initialState);

  return (
    <form
      action={formAction}
      onSubmit={confirmSubmit(
        `Record a ${feeLabel} payment and activate this member?`
      )}
      className="space-y-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <Feedback state={state} />
      <p className="text-sm text-muted-foreground">
        Use this when the member paid the activation fee ({feeLabel}) in cash
        or by bank transfer. It records the payment and activates the account.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="method" defaultValue="" required className={selectClass}>
          <option value="" disabled>
            Paid by…
          </option>
          <option value="cash">Cash</option>
          <option value="transfer">Bank transfer</option>
        </select>
        <Input name="note" placeholder="Note (optional), e.g. transfer reference" className="sm:max-w-sm" />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        {isPending ? "Saving..." : "Record payment & activate"}
      </Button>
    </form>
  );
}

export function StatusChangeForm({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(setMembershipStatus, initialState);

  return (
    <form
      action={formAction}
      onSubmit={confirmSubmit("Change this member's status?")}
      className="space-y-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <Feedback state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="status" defaultValue="" required className={selectClass}>
          <option value="" disabled>
            Change status to…
          </option>
          {currentStatus !== "ACTIVE" && currentStatus !== "PENDING" && (
            <option value="ACTIVE">Active (restore)</option>
          )}
          {currentStatus !== "INACTIVE" && <option value="INACTIVE">Inactive</option>}
          {currentStatus !== "CANCELLED" && <option value="CANCELLED">Cancelled</option>}
        </select>
        <Input name="reason" required placeholder="Reason (required)" className="sm:max-w-sm" />
      </div>
      <p className="text-xs text-muted-foreground">
        Lapsed is set automatically from dues. Restoring a member who was
        inactive for a long time charges every month since their start date,
        so waive any months they shouldn&apos;t owe.
      </p>
      <Button type="submit" disabled={isPending} variant="outline" className="rounded-full">
        {isPending ? "Saving..." : "Change status"}
      </Button>
    </form>
  );
}

export function DuesChargeActions({ chargeId }: { chargeId: string }) {
  const [paidState, paidAction, paidPending] = useActionState(markDuesPaid, initialState);
  const [waiveState, waiveAction, waivePending] = useActionState(waiveDues, initialState);

  return (
    <div className="w-full space-y-2 rounded-lg bg-muted/40 p-3">
      <Feedback state={paidState} />
      <Feedback state={waiveState} />

      <form
        action={paidAction}
        onSubmit={confirmSubmit("Mark this month as paid?")}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input type="hidden" name="chargeId" value={chargeId} />
        <select name="method" defaultValue="" required className={selectClass}>
          <option value="" disabled>
            Paid by…
          </option>
          <option value="cash">Cash</option>
          <option value="transfer">Bank transfer</option>
        </select>
        <Input name="note" placeholder="Note (optional)" className="sm:max-w-xs" />
        <Button type="submit" size="sm" disabled={paidPending || waivePending}
          className="rounded-full bg-brand-green text-white hover:bg-brand-green/90">
          {paidPending ? "Saving..." : "Mark paid"}
        </Button>
      </form>

      <form
        action={waiveAction}
        onSubmit={confirmSubmit("Waive this month's dues? The member won't owe it.")}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input type="hidden" name="chargeId" value={chargeId} />
        <Input name="reason" required placeholder="Reason to waive (required)" className="sm:max-w-xs" />
        <Button type="submit" size="sm" variant="outline" disabled={paidPending || waivePending}
          className="rounded-full">
          {waivePending ? "Saving..." : "Waive"}
        </Button>
      </form>
    </div>
  );
}
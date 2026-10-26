"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  cancelRsvp,
  rsvpToRun,
  type RsvpActionState,
} from "@/server/runs/actions";

const initialState: RsvpActionState = {};

const selectClass =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function RsvpForm({
  runId,
  guestsAllowed,
  maxGuests,
  myGuests,
  spotsLeft,
}: {
  runId: string;
  guestsAllowed: boolean;
  maxGuests: number;
  // null = not going yet; otherwise how many guests they're bringing
  myGuests: number | null;
  // null = no limit; counts everyone already going (including this member)
  spotsLeft: number | null;
}) {
  const [rsvpState, rsvpAction, rsvpPending] = useActionState(rsvpToRun, initialState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelRsvp, initialState);

  const going = myGuests !== null;
  const full = !going && spotsLeft !== null && spotsLeft <= 0;
  const error = rsvpState.error ?? cancelState.error;
  const success = rsvpState.success ?? cancelState.success;

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-brand-mint px-3 py-2 text-sm text-brand-forest">
          {success}
        </p>
      )}

      {full ? (
        <p className="text-sm font-medium text-muted-foreground">This run is full.</p>
      ) : (
        <form action={rsvpAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="runId" value={runId} />

          {guestsAllowed && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Guests</span>
              <select
                key={myGuests ?? "new"}
                name="guests"
                defaultValue={String(myGuests ?? 0)}
                className={selectClass}
              >
                {Array.from({ length: maxGuests + 1 }, (_, n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "None" : n}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(!going || guestsAllowed) && (
            <Button
              type="submit"
              disabled={rsvpPending || cancelPending}
              className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
            >
              {rsvpPending ? "Saving..." : going ? "Update" : "I'm going"}
            </Button>
          )}
        </form>
      )}

      {going && (
        <form
          action={cancelAction}
          onSubmit={(event) => {
            if (!window.confirm("Cancel your RSVP for this run?")) event.preventDefault();
          }}
        >
          <input type="hidden" name="runId" value={runId} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={rsvpPending || cancelPending}
            className="rounded-full"
          >
            {cancelPending ? "Cancelling..." : "Cancel RSVP"}
          </Button>
        </form>
      )}
    </div>
  );
}
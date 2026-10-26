"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlyerField } from "@/components/admin/flyer-field";
import { saveRun, type RunActionState } from "@/server/admin/run-actions";

const initialState: RunActionState = {};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export type RunFormValues = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  capacity: string;
  guestsAllowed: boolean;
  maxGuests: number;
  inSeries: boolean;
  flyerPath: string | null;
};

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function RunForm({ run }: { run?: RunFormValues }) {
  const [state, formAction, isPending] = useActionState(saveRun, initialState);
  const isEdit = Boolean(run);

  return (
    <form action={formAction} className="space-y-4">
      {run && <input type="hidden" name="id" value={run.id} />}

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Field label="Title" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={run?.title ?? ""}
          placeholder="e.g. Saturday Long Run"
        />
      </Field>

      <Field label="Location" htmlFor="location">
        <Input
          id="location"
          name="location"
          required
          maxLength={200}
          defaultValue={run?.location ?? ""}
          placeholder="e.g. Lekki Phase 1 Gate"
        />
      </Field>

      <FlyerField initialPath={run?.flyerPath ?? null} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={isEdit ? "Date" : "Date (first run)"} htmlFor="date">
          <Input id="date" name="date" type="date" required defaultValue={run?.date ?? ""} />
        </Field>
        <Field label="Start time" htmlFor="time">
          <Input id="time" name="time" type="time" required defaultValue={run?.time ?? ""} />
        </Field>
      </div>

      <Field label="Details (optional)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={run?.description ?? ""}
          placeholder="Distance, pace groups, what to bring..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Capacity (optional)"
          htmlFor="capacity"
          hint="Leave blank for no limit. Guests count towards this."
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            defaultValue={run?.capacity ?? ""}
            placeholder="No limit"
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="guestsAllowed"
            defaultChecked={run?.guestsAllowed ?? false}
            className="h-4 w-4 accent-[var(--color-brand-green)]"
          />
          Bring-a-friend run (members can bring guests)
        </label>
        <Field label="Guests allowed per member" htmlFor="maxGuests">
          <select
            id="maxGuests"
            name="maxGuests"
            defaultValue={String(run?.maxGuests ?? 1)}
            className={`${selectClass} sm:max-w-[10rem]`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!isEdit && (
        <div className="space-y-3 rounded-lg border p-3">
          <Field label="Repeat" htmlFor="repeat">
            <select id="repeat" name="repeat" defaultValue="none" className={`${selectClass} sm:max-w-xs`}>
              <option value="none">Doesn&apos;t repeat (one-off run)</option>
              <option value="WEEKLY">Every week</option>
              <option value="FORTNIGHTLY">Every 2 weeks</option>
              <option value="MONTHLY">Every month (same date)</option>
            </select>
          </Field>
          <Field
            label="Repeat until (optional)"
            htmlFor="repeatUntil"
            hint="Leave blank to keep repeating until you end it."
          >
            <Input id="repeatUntil" name="repeatUntil" type="date" className="sm:max-w-xs" />
          </Field>
        </div>
      )}

      {run?.inSeries && (
        <label className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm">
          <input
            type="checkbox"
            name="applyFuture"
            className="mt-0.5 h-4 w-4 accent-[var(--color-brand-green)]"
          />
          <span>
            Also apply these changes to all <strong>future</strong> runs in this series
            <span className="block text-xs text-muted-foreground">
              Title, location, flyer, details, capacity and guest rules. The date and time only
              change for this run. Runs you edited individually are left alone.
            </span>
          </span>
        </label>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        {isPending ? "Saving..." : isEdit ? "Save changes" : "Create run"}
      </Button>
    </form>
  );
}
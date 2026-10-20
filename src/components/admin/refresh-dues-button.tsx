"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { refreshAllDues } from "@/server/admin/dues-actions";
import type { AdminActionState } from "@/server/admin/member-actions";

const initialState: AdminActionState = {};

export function RefreshDuesButton() {
  const [state, formAction, isPending] = useActionState(refreshAllDues, initialState);

  return (
    <form action={formAction} className="space-y-2">
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-brand-mint px-3 py-2 text-sm text-brand-forest">
          {state.success}
        </p>
      )}
      <Button type="submit" variant="outline" disabled={isPending} className="w-full rounded-full sm:w-auto">
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing..." : "Refresh all dues"}
      </Button>
    </form>
  );
}
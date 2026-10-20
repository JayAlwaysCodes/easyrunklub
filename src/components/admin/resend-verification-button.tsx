"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/server/admin/verification-actions";
import type { AdminActionState } from "@/server/admin/member-actions";

const initialState: AdminActionState = {};

export function ResendVerificationButton({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState(
    resendVerificationEmail,
    initialState
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
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
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={isPending}
        className="rounded-full"
      >
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
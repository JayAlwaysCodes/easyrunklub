"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAdmin, removeAdmin } from "@/server/admin/admin-management-actions";
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

export function AddAdminForm() {
  const [state, formAction, isPending] = useActionState(addAdmin, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Feedback state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="email"
          type="email"
          required
          placeholder="Email of an existing, verified member"
          className="sm:max-w-sm"
        />
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
        >
          {isPending ? "Adding..." : "Make admin"}
        </Button>
      </div>
    </form>
  );
}

export function RemoveAdminButton({ userId, name }: { userId: string; name: string }) {
  const [state, formAction, isPending] = useActionState(removeAdmin, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Remove admin access for ${name}? They'll become a regular member.`)) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <Feedback state={state} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={isPending}
        className="rounded-full text-destructive hover:text-destructive"
      >
        {isPending ? "Removing..." : "Remove admin"}
      </Button>
    </form>
  );
}
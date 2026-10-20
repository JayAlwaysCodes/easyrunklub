"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfile,
  type ProfileActionState,
} from "@/server/profile/actions";

type ProfileFormProps = {
  defaults: {
    name: string;
    phone: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
};

const initialState: ProfileActionState = {};

export function ProfileForm({ defaults }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required defaultValue={defaults.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={defaults.phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              defaultValue={defaults.dateOfBirth}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              required
              defaultValue={defaults.gender}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address / City</Label>
            <Input
              id="address"
              name="address"
              required
              defaultValue={defaults.address}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Emergency contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              required
              defaultValue={defaults.emergencyContactName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Contact phone</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              required
              defaultValue={defaults.emergencyContactPhone}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
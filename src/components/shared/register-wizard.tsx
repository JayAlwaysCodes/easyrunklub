"use client";

import { useActionState, useRef, useState } from "react";

import { registerAction, type ActionState } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const initialState: ActionState = {};
const TOTAL_STEPS = 3;

export function RegisterWizard() {
  const [step, setStep] = useState(1);
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  function goToNextStep() {
    const form = formRef.current;
    if (!form) return;

    // Only the fields visible on the current step should block
    // advancing — fields on other (hidden) steps are ignored here.
    const currentStepFields = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement
    >(`[data-step="${step}"] [required]`);

    for (const field of currentStepFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign up on Easy Run Klub</CardTitle>
        <CardDescription>
          Step {step} of {TOTAL_STEPS}
        </CardDescription>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < step ? "bg-brand-green" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <form ref={formRef} action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          {/* Step 1 — Account Basics */}
          <div data-step={1} className={step === 1 ? "space-y-4" : "hidden"}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          {/* Step 2 — Personal Details */}
          <div data-step={2} className={step === 2 ? "space-y-4" : "hidden"}>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                required
                defaultValue=""
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
              <Input id="address" name="address" required />
            </div>
          </div>

          {/* Step 3 — Emergency Contact */}
          <div data-step={3} className={step === 3 ? "space-y-4" : "hidden"}>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">
                Emergency contact name
              </Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                Emergency contact phone
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                required
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="acceptedTerms"
                required
                className="mt-0.5"
              />
              <span>
                I agree to the{" "}
                
                <a  href="/terms"
                  target="_blank"
                  className="font-medium text-brand-forest underline"
                >
                  Terms and Conditions
                </a>
              </span>
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(s - 1, 1))}
              className="flex-1 rounded-full"
            >
              Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={goToNextStep}
              className="flex-1 rounded-full bg-brand-green text-white hover:bg-brand-green/90"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-brand-green text-white hover:bg-brand-green/90"
            >
              {isPending ? "Signing up..." : "Sign Up"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
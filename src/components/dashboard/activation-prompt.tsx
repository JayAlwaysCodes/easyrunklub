"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { startActivationCheckout } from "@/server/payments/actions";

export function ActivationPrompt({ feeKobo }: { feeKobo: number }) {
  const [open, setOpen] = useState(true);
  const feeNaira = (feeKobo / 100).toLocaleString("en-NG");

  return (
    <>
      {/* Persistent banner — stays visible even if the popup is dismissed,
          since the user can activate anytime from here too. */}
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
          <div>
            <p className="font-medium text-yellow-900">
              Your account is pending activation
            </p>
            <p className="text-sm text-yellow-800">
              Pay the one-time activation fee to unlock your full membership.
            </p>
          </div>
        </div>
        <form action={startActivationCheckout}>
          <Button
            type="submit"
            className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            Activate Now
          </Button>
        </form>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate your account</DialogTitle>
            <DialogDescription>
              Welcome to Easy Run Klub! Pay the one-time activation fee of{" "}
              <strong>₦{feeNaira}</strong> to unlock your membership ID and
              full member dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <form action={startActivationCheckout} className="w-full">
              <Button
                type="submit"
                className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
              >
                Activate Now
              </Button>
            </form>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              I&apos;ll do this later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
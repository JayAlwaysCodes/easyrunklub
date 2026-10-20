"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { sendVerificationEmail } from "@/server/auth/email-verification";

export function VerifyEmailButton() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleClick() {
    setStatus("sending");
    try {
      await sendVerificationEmail();
      setStatus("sent");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-brand-forest">
        Verification link sent! Check your email (or the server console in
        development).
      </p>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={status === "sending"}
      variant="outline"
      className="rounded-full"
    >
      {status === "sending" ? "Sending..." : "Verify Email"}
    </Button>
  );
}
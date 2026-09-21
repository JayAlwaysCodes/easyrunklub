"use client";

import { useAuthModal } from "@/components/shared/auth-modal-context";

export function CtaSection() {
    const { openRegisterDisclaimer } = useAuthModal();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
      <p className="text-sm font-medium text-brand-green">Easy Run Klub</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold md:text-4xl">
        Your Next Run Starts Here,
        <br />
        Run with the Pack
      </h2>
      <button
        onClick={openRegisterDisclaimer}
        className="mt-6 rounded-full bg-brand-mint px-6 py-2.5 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-mint/70"
      >
        Get Started
      </button>
    </section>
  );
}
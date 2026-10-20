"use client";

import { useEffect, useState } from "react";

const SHOW_MS = 1000;
const FADE_MS = 500;

export function Preloader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), SHOW_MS);
    const goneTimer = setTimeout(() => setPhase("gone"), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      id="erk-splash"
      aria-hidden="true"
      style={{ transitionDuration: `${FADE_MS}ms` }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="font-heading text-3xl font-semibold tracking-tight text-brand-forest sm:text-4xl">
        Easy Run <span className="text-brand-green">Klub</span>
      </p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-brand-mint">
        <div className="erk-splash-bar h-full w-1/3 rounded-full bg-brand-green" />
      </div>
    </div>
  );
}
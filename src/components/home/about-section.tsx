"use client";

import Image from "next/image";
import Link from "next/link";

import { useAuthModal } from "@/components/shared/auth-modal-context";

export function AboutSection() {
  const { openRegisterDisclaimer } = useAuthModal();

  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="group inline-flex flex-col gap-4">
          <span className="w-fit rounded-full bg-brand-mint px-4 py-1.5 text-sm font-medium text-brand-forest">
            About Us
          </span>
          <Link
            href="/about"
            className="text-sm font-medium text-brand-forest underline decoration-red-500 underline-offset-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            Read more
          </Link>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            We started with Easy Run Klub meeting at sunrise. Today, we are a
            global collective empowering everyday athletes to cross their
            first finish line or smash their next personal record. No pace
            requirements, no steep membership fees, just open roads and
            shared energy.
          </p>
          <button
            onClick={openRegisterDisclaimer}
            className="text-sm font-semibold text-brand-forest underline decoration-red-500 underline-offset-4"
          >
            Join The Club.
          </button>
        </div>
      </div>

      <div className="relative mt-10 h-[400px] w-full overflow-hidden rounded-2xl md:h-[500px]">
        <Image
          src="/home/about-photo.jpeg"
          alt="Easy Run Klub members celebrating with medals"
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}
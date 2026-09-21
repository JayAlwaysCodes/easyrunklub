"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No email-sending service is wired up yet — this is a placeholder
    // until a real provider (e.g. Resend) is chosen in a later module.
    const formData = new FormData(event.currentTarget);
    console.log("Contact form submission:", Object.fromEntries(formData));
    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div className="rounded-2xl border bg-brand-mint p-6">
        <p className="font-medium text-brand-forest">Message sent!</p>
        <p className="mt-1 text-sm text-brand-forest/80">
          Thanks for reaching out — we&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Your name" />
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
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required placeholder="Subject" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Your message"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
        />
      </div>
      <Button
        type="submit"
        className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
      >
        Send Message
      </Button>
    </form>
  );
}
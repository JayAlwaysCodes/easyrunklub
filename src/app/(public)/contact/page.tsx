import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
  LinkedInIcon,
} from "@/components/shared/social-icons";

export const metadata: Metadata = {
  title: "Contact | Easy Run Klub",
};



export default function ContactPage() {
    const SOCIAL_LINKS = [
    { href: "#", label: "Facebook", icon: FacebookIcon },
    { href: "#", label: "Instagram", icon: InstagramIcon },
    { href: "#", label: "X", icon: XIcon },
    { href: "#", label: "LinkedIn", icon: LinkedInIcon },
    ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        Contact Us
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Have a question about the Klub, an upcoming run, or want to
        partner with us? Send us a message and we&apos;ll get back to you.
      </p>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto_1fr]">
        <ContactForm />

        <div className="hidden w-px bg-brand-green md:block" />

        <div className="space-y-8">
          <div>
            <h2 className="font-medium">Contact us</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              +234-913-0000-514
            </p>
            <p className="text-sm text-muted-foreground">
              EasyRunKlub123@gmail.com
            </p>
          </div>

          <div>
            <h2 className="font-medium">Location</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              123 Uyo Easy Run Club Street
            </p>
          </div>

          <div>
            <h2 className="font-medium">Follow us</h2>
            <div className="mt-3 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                    <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-forest/20 text-brand-forest/70 transition-colors hover:border-brand-forest hover:text-brand-forest"
                    >
                    <Icon className="h-4 w-4" />
                    </a>
                );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
  LinkedInIcon,
} from "@/components/shared/social-icons";

const FOOTER_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

const SOCIAL_LINKS = [
  { href: "#", label: "Facebook", icon: FacebookIcon },
  { href: "#", label: "Instagram", icon: InstagramIcon },
  { href: "#", label: "X", icon: XIcon },
  { href: "#", label: "LinkedIn", icon: LinkedInIcon },
];
export function PublicFooter() {
  return (
    <footer className="bg-brand-forest text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
                <h2 className="font-heading text-2xl font-semibold">
                Easy Run Klub
                </h2>
                <p className="max-w-sm text-sm text-white/70">
                We started with Easy Run Klub meeting at sunrise. Today, we are
                a global collective empowering everyday athletes to cross
                their first finish.
                </p>
            </div>

            <div className="space-y-6">
                <nav className="flex flex-wrap gap-x-6 gap-y-2">
                {FOOTER_LINKS.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                    {link.label}
                    </Link>
                ))}
                </nav>

                <div className="space-y-4 text-sm text-white/70">
                    <div>
                        <p className="font-medium text-white">Contact us</p>
                        <p className="mt-1">+234-913-0000-514</p>
                        <p>EasyRunKlub123@gmail.com</p>
                    </div>
                    <div>
                        <p className="font-medium text-white">Location</p>
                        <p className="mt-1">123 Uyo Easy Run Club Street</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-white/10 pt-6 md:flex-row md:justify-between">
          <p className="text-xs text-white/50">All Rights Reserved</p>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
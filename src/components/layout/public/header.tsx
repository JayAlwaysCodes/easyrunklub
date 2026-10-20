"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { useAuthModal } from "@/components/shared/auth-modal-context";

const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      {label}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-red-500 transition-all duration-300 group-hover:w-full" />    </Link>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { openLogin, openRegisterDisclaimer } = useAuthModal();

  return (
    <header className="sticky top-0 z-40   backdrop-blur rounded-3xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={openLogin}
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Sign in
          </button>
          <Button
            onClick={openRegisterDisclaimer}
            className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            Sign up
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle asChild>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Button
                  className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
                  onClick={() => {
                    setOpen(false);
                    openRegisterDisclaimer();
                  }}
                >
                  Sign up
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setOpen(false);
                    openLogin();
                  }}
                >
                  Sign in
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
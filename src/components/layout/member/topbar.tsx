"use client";

import { Menu } from "lucide-react";

import { UserNav } from "@/components/shared/user-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { MemberNavLinks } from "@/components/layout/member/sidebar";
import { Logo } from "@/components/shared/logo";
import { useState } from "react";

export function MemberTopbar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="h-16 justify-center border-b px-4">
              <SheetTitle asChild>
                <Logo href="/dashboard" />
              </SheetTitle>
            </SheetHeader>
            <MemberNavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <UserNav name={name} email={email} />
      </div>
    </header>
  );
}
"use client";

import { useState } from "react";
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
import { useUnreadAnnouncements } from "@/components/layout/member/unread-provider";
import { Logo } from "@/components/shared/logo";

export function MemberTopbar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { unread } = useUnreadAnnouncements();

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={unread > 0 ? "Open menu (new announcements)" : "Open menu"}
            >
              <Menu className="h-5 w-5" />
              {unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background"
                />
              )}
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
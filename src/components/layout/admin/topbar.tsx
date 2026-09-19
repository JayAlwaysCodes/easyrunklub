"use client";

import Link from "next/link";
import { Menu, ArrowLeft } from "lucide-react";
import { useState } from "react";

import { UserNav } from "@/components/shared/user-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/layout/admin/sidebar";
import { Logo } from "@/components/shared/logo";

export function AdminTopbar({
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
                <Logo href="/admin/dashboard" />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col">
              <AdminNavLinks onNavigate={() => setOpen(false)} />
              <div className="border-t p-3">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Member Dashboard
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <UserNav name={name} email={email} />
      </div>
    </header>
  );
}
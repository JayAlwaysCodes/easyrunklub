"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  CalendarDays,
  Megaphone,
  ShieldCheck,
  Radio,
  TrendingUp,
  LifeBuoy,
  Settings,
  UserCog,
  ScrollText,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Flip to true when the page exists. Unbuilt pages show "Soon".
  ready: boolean;
  // Only the Master Admin sees this item.
  superOnly?: boolean;
};

type NavGroup = { heading?: string; items: NavItem[] };

const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, ready: true },
    ],
  },
  {
    heading: "Manage",
    items: [
      { href: "/admin/dashboard/members", label: "Members", icon: Users, ready: true },
      { href: "/admin/dashboard/payments", label: "Payments", icon: CreditCard, ready: true },
      { href: "/admin/dashboard/dues", label: "Monthly Dues", icon: Receipt, ready: true },
      { href: "/admin/dashboard/runs", label: "Runs & Events", icon: CalendarDays, ready: true },
    ],
  },
  {
    heading: "Engage",
    items: [
      { href: "/admin/dashboard/communication", label: "Communication", icon: Megaphone, ready: true },
      { href: "/admin/dashboard/moderation", label: "Moderation", icon: ShieldCheck, ready: false },
      { href: "/admin/dashboard/live", label: "Live Stream", icon: Radio, ready: false },
      { href: "/admin/dashboard/support", label: "Support", icon: LifeBuoy, ready: false },
    ],
  },
  {
    heading: "Club",
    items: [
      { href: "/admin/dashboard/reports", label: "Reports", icon: TrendingUp, ready: true },
      { href: "/admin/dashboard/settings", label: "Settings", icon: Settings, ready: true, superOnly: true },
      { href: "/admin/dashboard/admins", label: "Admins", icon: UserCog, ready: true, superOnly: true },
      { href: "/admin/dashboard/audit-log", label: "Audit Log", icon: ScrollText, ready: true, superOnly: true },
    ],
  },
];

export function AdminNavLinks({
  isSuperAdmin,
  onNavigate,
}: {
  isSuperAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.superOnly || isSuperAdmin),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3">
      {groups.map((group, groupIndex) => (
        <div key={group.heading ?? groupIndex} className="space-y-1">
          {group.heading && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.heading}
            </p>
          )}

          {group.items.map((item) => {
            const Icon = item.icon;

            if (!item.ready) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Soon
                  </span>
                </div>
              );
            }

            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Logo href="/admin/dashboard" />
        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Admin
        </span>
      </div>
      <AdminNavLinks isSuperAdmin={isSuperAdmin} />
      <div className="border-t p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Member Dashboard
        </Link>
      </div>
    </aside>
  );
}
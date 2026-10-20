"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  User,
  CalendarDays,
  Activity,
  Target,
  Trophy,
  Megaphone,
  Radio,
  MessageSquare,
  Users,
  Upload,
  LifeBuoy,
  Lock,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useMemberAccess } from "@/components/layout/member/member-access";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Flip to true when the page exists. Unbuilt pages show "Soon" and
  // can't be clicked, so members never hit a 404.
  ready: boolean;
  // "always": any logged-in member (even pending or lapsed)
  // "active": ACTIVE members only (admins bypass)
  access: "always" | "active";
};

type NavGroup = {
  heading?: string;
  items: NavItem[];
};

const MEMBER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, ready: true, access: "always" },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, ready: true, access: "always" },
      { href: "/dashboard/dues", label: "Monthly Dues", icon: Receipt, ready: true, access: "always" },
      { href: "/dashboard/profile", label: "Profile", icon: User, ready: true, access: "always" },
    ],
  },
  {
    heading: "Running",
    items: [
      { href: "/dashboard/runs", label: "Upcoming Runs", icon: CalendarDays, ready: false, access: "active" },
      { href: "/dashboard/run-log", label: "Run Log", icon: Activity, ready: false, access: "always" },
      { href: "/dashboard/targets", label: "My Targets", icon: Target, ready: false, access: "always" },
      { href: "/dashboard/challenges", label: "Challenges", icon: Trophy, ready: false, access: "active" },
    ],
  },
  {
    heading: "Community",
    items: [
      { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone, ready: false, access: "always" },
      { href: "/dashboard/live", label: "Live Stream", icon: Radio, ready: false, access: "active" },
      { href: "/dashboard/feed", label: "Community Feed", icon: MessageSquare, ready: false, access: "active" },
      { href: "/dashboard/hangouts", label: "Social Hangouts", icon: Users, ready: false, access: "always" },
      { href: "/dashboard/chapters", label: "Chapters & Buddies", icon: Users, ready: false, access: "active" },
      { href: "/dashboard/submit", label: "Share Photos & Stories", icon: Upload, ready: false, access: "active" },
    ],
  },
  {
    heading: "Help",
    items: [
      { href: "/dashboard/support", label: "Support & Feedback", icon: LifeBuoy, ready: false, access: "always" },
    ],
  },
];

export function MemberNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { status, hasFullAccess } = useMemberAccess();

  // Where a locked item sends the member: lapsed members go to pay dues,
  // everyone else to the Overview (where the activation prompt lives).
  const lockedHref = status === "LAPSED" ? "/dashboard/dues" : "/dashboard";
  const lockedHint =
    status === "LAPSED"
      ? "Pay your monthly dues to unlock"
      : "Activate your account to unlock";

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3">
      {MEMBER_NAV.map((group, groupIndex) => (
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

            const isLocked = item.access === "active" && !hasFullAccess;

            if (isLocked) {
              return (
                <Link
                  key={item.href}
                  href={lockedHref}
                  onClick={onNavigate}
                  title={lockedHint}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60 transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  <Lock className="h-3.5 w-3.5" />
                </Link>
              );
            }

            // Overview matches exactly; other pages also match their sub-pages.
            const isActive =
              item.href === "/dashboard"
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

export function MemberSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Logo href="/dashboard" />
      </div>
      <MemberNavLinks />
    </aside>
  );
}
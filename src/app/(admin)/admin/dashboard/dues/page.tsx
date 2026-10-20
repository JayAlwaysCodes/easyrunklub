import Link from "next/link";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshDuesButton } from "@/components/admin/refresh-dues-button";
import { formatDate, formatNaira } from "@/lib/format";

export const metadata = { title: "Monthly Dues | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const VIEWS = [
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Coming up" },
  { key: "paid", label: "Paid" },
  { key: "waived", label: "Waived" },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

function lagosMonthStart(offset: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  return new Date(Date.UTC(year, month + offset, 1) - 60 * 60 * 1000);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

type SearchParams = { view?: string; q?: string; page?: string };

export default async function AdminDuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view: ViewKey = VIEWS.some((v) => v.key === params.view)
    ? (params.view as ViewKey)
    : "overdue";
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const now = new Date();
  const monthStart = lagosMonthStart(0);
  const nextMonthStart = lagosMonthStart(1);
  const { duesGraceDays } = await getClubSettings();

  const search: Prisma.DuesChargeWhereInput = q
    ? {
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { membership: { membershipNumber: { contains: q, mode: "insensitive" } } },
          ],
        },
      }
    : {};

  const viewWhere: Record<ViewKey, Prisma.DuesChargeWhereInput> = {
    overdue: { status: "DUE", dueDate: { lt: now } },
    upcoming: { status: "DUE", dueDate: { gte: now } },
    paid: { status: "PAID" },
    waived: { status: "WAIVED" },
  };

  const orderBy: Record<ViewKey, Prisma.DuesChargeOrderByWithRelationInput> = {
    overdue: { dueDate: "asc" },
    upcoming: { dueDate: "asc" },
    paid: { paidAt: "desc" },
    waived: { periodStart: "desc" },
  };

  const where = { ...viewWhere[view], ...search };

  const [
    tabCounts,
    outstanding,
    lapsedMembers,
    collectedThisMonth,
    total,
    charges,
  ] = await Promise.all([
    Promise.all(VIEWS.map((v) => prisma.duesCharge.count({ where: { ...viewWhere[v.key], ...search } }))),
    prisma.duesCharge.aggregate({ where: { status: "DUE" }, _sum: { amount: true } }),
    prisma.membership.count({ where: { status: "LAPSED" } }),
    prisma.duesCharge.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.duesCharge.count({ where }),
    prisma.duesCharge.findMany({
      where,
      orderBy: orderBy[view],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            membership: { select: { membershipNumber: true, status: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(targetView: string, targetPage = 1) {
    const sp = new URLSearchParams();
    sp.set("view", targetView);
    if (q) sp.set("q", q);
    if (targetPage > 1) sp.set("page", String(targetPage));
    return `/admin/dashboard/dues?${sp.toString()}`;
  }

  function statusLine(charge: (typeof charges)[number]) {
    if (charge.status === "PAID") {
      return {
        text: `Paid ${charge.paidAt ? formatDate(charge.paidAt) : ""} (${charge.paidVia ?? "—"})`,
        className: "text-brand-forest",
      };
    }
    if (charge.status === "WAIVED") {
      return { text: "Waived", className: "text-muted-foreground" };
    }
    if (charge.dueDate >= now) {
      const days = Math.ceil((charge.dueDate.getTime() - now.getTime()) / DAY_MS);
      return {
        text: `Due ${formatDate(charge.dueDate)} · in ${days} day${days === 1 ? "" : "s"}`,
        className: "text-muted-foreground",
      };
    }
    const lapseAt = new Date(charge.dueDate.getTime() + duesGraceDays * DAY_MS);
    if (charge.user.membership?.status === "LAPSED" || now > lapseAt) {
      return { text: `Overdue since ${formatDate(charge.dueDate)} · Lapsed`, className: "text-red-700" };
    }
    const left = Math.ceil((lapseAt.getTime() - now.getTime()) / DAY_MS);
    return {
      text: `Overdue since ${formatDate(charge.dueDate)} · lapses in ${left} day${left === 1 ? "" : "s"}`,
      className: "text-yellow-700",
    };
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Monthly Dues</h1>
          <p className="text-muted-foreground">
            Who owes, who&apos;s about to lapse, and what has been collected.
          </p>
        </div>
        <RefreshDuesButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding"
          value={formatNaira(outstanding._sum.amount ?? 0)}
          hint="All unpaid dues"
        />
        <StatCard
          label="Collected this month"
          value={formatNaira(collectedThisMonth._sum.amount ?? 0)}
        />
        <StatCard
          label="Lapsed members"
          value={String(lapsedMembers)}
          hint={`After a ${duesGraceDays}-day grace period`}
        />
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="view" value={view} />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, email or ERK number"
          className="sm:max-w-sm"
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 rounded-full bg-brand-green text-white hover:bg-brand-green/90 sm:flex-none">
            Search
          </Button>
          {q && (
            <Button asChild variant="outline" className="flex-1 rounded-full sm:flex-none">
              <Link href={href(view)}>Clear</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v, i) => (
          <Link
            key={v.key}
            href={href(v.key)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              view === v.key
                ? "border-brand-green bg-brand-green text-white"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {v.label} <span className="opacity-80">({tabCounts[i]})</span>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {charges.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {view === "overdue"
                ? "Nobody is overdue. 🎉"
                : "Nothing to show here."}
            </p>
          ) : (
            <ul className="divide-y">
              {charges.map((charge) => {
                const line = statusLine(charge);
                return (
                  <li key={charge.id}>
                    <Link
                      href={`/admin/dashboard/members/${charge.user.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {charge.user.name ?? charge.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {charge.user.membership?.membershipNumber ?? "—"} ·{" "}
                          {monthLabel(charge.periodStart)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatNaira(charge.amount)}</p>
                        <p className={`text-xs ${line.className}`}>{line.text}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href(view, page - 1)} className="font-medium text-brand-green hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href(view, page + 1)} className="font-medium text-brand-green hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
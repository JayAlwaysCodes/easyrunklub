import Link from "next/link";
import { AlertTriangle, Users, Wallet, Banknote, Clock } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { statusBadgeClass, statusLabel } from "@/lib/membership-status";

export const metadata = { title: "Overview | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const REVENUE_PURPOSES = ["ACTIVATION", "DUES"] as const;

// Lagos is UTC+1 all year (no daylight saving), so a month starts at
// 00:00 Lagos time = 23:00 UTC the day before.
function lagosMonthStart(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1) - 60 * 60 * 1000);
}

function currentLagosYearMonth(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  return { year, month };
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-heading text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-brand-green" />
      </CardContent>
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const now = new Date();
  const { year, month } = currentLagosYearMonth(now);
  const thisMonthStart = lagosMonthStart(year, month);
  const nextMonthStart = lagosMonthStart(year, month + 1);

  // Boundaries for the last 6 months (oldest first), plus one end marker.
  const monthStarts = Array.from({ length: 7 }, (_, i) =>
    lagosMonthStart(year, month - 5 + i)
  );

  const [
    statusGroups,
    newThisMonth,
    unverified,
    revenueThisMonth,
    revenueAllTime,
    walletTotals,
    duesOutstanding,
    duesOverdue,
    pendingMembers,
    recentPayments,
    chartTransactions,
  ] = await Promise.all([
    prisma.membership.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count({
      where: { role: "MEMBER", createdAt: { gte: thisMonthStart, lt: nextMonthStart } },
    }),
    prisma.user.count({ where: { role: "MEMBER", emailVerified: null } }),
    prisma.transaction.aggregate({
      where: {
        status: "COMPLETED",
        purpose: { in: [...REVENUE_PURPOSES] },
        createdAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED", purpose: { in: [...REVENUE_PURPOSES] } },
      _sum: { amount: true },
    }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.duesCharge.aggregate({
      where: { status: "DUE" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.duesCharge.count({ where: { status: "DUE", dueDate: { lt: now } } }),
    prisma.user.findMany({
      where: { role: "MEMBER", membership: { status: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", purpose: { in: [...REVENUE_PURPOSES] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { wallet: { include: { user: { select: { id: true, name: true, email: true } } } } },
    }),
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        purpose: { in: [...REVENUE_PURPOSES] },
        createdAt: { gte: monthStarts[0], lt: monthStarts[6] },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const group of statusGroups) counts[group.status] = group._count._all;
  const totalMembers = Object.values(counts).reduce((a, b) => a + b, 0);

  const monthly = Array.from({ length: 6 }, (_, i) => ({
    label: monthStarts[i].toLocaleDateString("en-GB", {
      month: "short",
      timeZone: "Africa/Lagos",
    }),
    total: 0,
  }));
  for (const tx of chartTransactions) {
    for (let i = 0; i < 6; i++) {
      if (tx.createdAt >= monthStarts[i] && tx.createdAt < monthStarts[i + 1]) {
        monthly[i].total += tx.amount;
        break;
      }
    }
  }
  const maxMonth = Math.max(1, ...monthly.map((m) => m.total));

  const statusOrder = ["ACTIVE", "PENDING", "LAPSED", "INACTIVE", "CANCELLED"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">How the club is doing right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total members"
          value={String(totalMembers)}
          hint={`${newThisMonth} joined this month`}
          icon={Users}
        />
        <StatCard
          label="Revenue this month"
          value={formatNaira(revenueThisMonth._sum.amount ?? 0)}
          hint={`${formatNaira(revenueAllTime._sum.amount ?? 0)} all time`}
          icon={Banknote}
        />
        <StatCard
          label="Dues outstanding"
          value={formatNaira(duesOutstanding._sum.amount ?? 0)}
          hint={`${duesOutstanding._count._all} unpaid · ${duesOverdue} overdue`}
          icon={Clock}
        />
        <StatCard
          label="Held in member wallets"
          value={formatNaira(walletTotals._sum.balance ?? 0)}
          hint="Money members have topped up"
          icon={Wallet}
        />
      </div>

      {(counts["PENDING"] > 0 || counts["LAPSED"] > 0 || unverified > 0) && (
        <Card className="rounded-2xl border-yellow-200 bg-yellow-50">
          <CardContent className="flex gap-3 pt-6 text-sm text-yellow-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <ul className="space-y-1">
              {counts["PENDING"] > 0 && (
                <li>{counts["PENDING"]} account(s) waiting for activation.</li>
              )}
              {counts["LAPSED"] > 0 && (
                <li>{counts["LAPSED"]} member(s) have lapsed because of unpaid dues.</li>
              )}
              {unverified > 0 && <li>{unverified} member(s) haven&apos;t verified their email.</li>}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members by status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusOrder.map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}
                >
                  {statusLabel(status)}
                </span>
                <span className="font-semibold">{counts[status] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue, last 6 months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-2">
              {monthly.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-md bg-brand-green"
                    style={{ height: `${Math.max(2, (m.total / maxMonth) * 100)}%` }}
                    title={formatNaira(m.total)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-center text-xs text-muted-foreground">
              {monthly.map((m) => (
                <div key={m.label} className="min-w-0 flex-1">
                  <p>{m.label}</p>
                  <p className="truncate font-medium text-foreground">{formatNaira(m.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waiting for activation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is waiting. 🎉</p>
            ) : (
              <ul className="divide-y">
                {pendingMembers.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/dashboard/members/${m.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-green"
                    >
                      <span className="min-w-0 truncate font-medium">{m.name ?? m.email}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y">
                {recentPayments.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/dashboard/members/${tx.wallet.user.id}`}
                        className="block truncate font-medium hover:text-brand-green"
                      >
                        {tx.wallet.user.name ?? tx.wallet.user.email}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.description ?? tx.purpose} · {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatNaira(tx.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
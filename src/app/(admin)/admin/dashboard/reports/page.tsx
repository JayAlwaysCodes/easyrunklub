import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { resolveRange } from "@/server/reports/range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatNaira } from "@/lib/format";
import { statusBadgeClass, statusLabel } from "@/lib/membership-status";

export const metadata = { title: "Reports | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MONTHS = 24;

const PROVIDER_LABELS: Record<string, string> = {
  paystack: "Card / bank (Paystack)",
  manual: "Cash or transfer (recorded by an admin)",
  wallet: "Member wallet",
};

function ymd(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function monthKeysBetween(fromStr: string, toStr: string) {
  const [fy, fm] = fromStr.split("-").map(Number);
  const [ty, tm] = toStr.split("-").map(Number);
  const keys: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys.slice(-MAX_MONTHS);
}

function monthName(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function lagosMonthKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .slice(0, 7);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 truncate font-heading text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { fromStr, toStr, start, end, today } = resolveRange(params.from, params.to);

  const [ty, tm, td] = today.split("-").map(Number);
  const presets = [
    { label: "This month", from: ymd(ty, tm - 1, 1), to: today },
    { label: "Last month", from: ymd(ty, tm - 2, 1), to: ymd(ty, tm - 1, 0) },
    { label: "Last 90 days", from: ymd(ty, tm - 1, td - 89), to: today },
    { label: "This year", from: ymd(ty, 0, 1), to: today },
  ];

  const [revenueTx, topups, signups, duesGroups, statusGroups] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        purpose: { in: ["ACTIVATION", "DUES"] },
        createdAt: { gte: start, lt: end },
      },
      select: { amount: true, purpose: true, provider: true, createdAt: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED", purpose: "TOPUP", createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    }),
    prisma.duesCharge.groupBy({
      by: ["status"],
      where: { dueDate: { gte: start, lt: end } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.membership.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  // Totals
  let totalRevenue = 0;
  const byPurpose = {
    ACTIVATION: { amount: 0, count: 0 },
    DUES: { amount: 0, count: 0 },
  };
  const byProvider = new Map<string, { amount: number; count: number }>();
  const monthKeys = monthKeysBetween(fromStr, toStr);
  const monthly = new Map(
    monthKeys.map((key) => [key, { signups: 0, activation: 0, dues: 0 }])
  );

  for (const tx of revenueTx) {
    totalRevenue += tx.amount;
    if (tx.purpose === "ACTIVATION" || tx.purpose === "DUES") {
      byPurpose[tx.purpose].amount += tx.amount;
      byPurpose[tx.purpose].count += 1;
    }

    const provider = tx.provider ?? "unknown";
    const entry = byProvider.get(provider) ?? { amount: 0, count: 0 };
    entry.amount += tx.amount;
    entry.count += 1;
    byProvider.set(provider, entry);

    const bucket = monthly.get(lagosMonthKey(tx.createdAt));
    if (bucket && tx.purpose === "ACTIVATION") bucket.activation += tx.amount;
    if (bucket && tx.purpose === "DUES") bucket.dues += tx.amount;
  }
  for (const user of signups) {
    const bucket = monthly.get(lagosMonthKey(user.createdAt));
    if (bucket) bucket.signups += 1;
  }

  const monthRows = monthKeys
    .map((key) => ({ key, ...(monthly.get(key) as { signups: number; activation: number; dues: number }) }))
    .reverse();
  const maxMonth = Math.max(1, ...monthRows.map((r) => r.activation + r.dues));

  // Dues falling due in this period
  const duesBy = (status: string) => duesGroups.find((g) => g.status === status);
  const duesPaid = duesBy("PAID")?._count._all ?? 0;
  const duesUnpaid = duesBy("DUE")?._count._all ?? 0;
  const duesWaived = duesBy("WAIVED")?._count._all ?? 0;
  const duesUnpaidAmount = duesBy("DUE")?._sum.amount ?? 0;
  const collectionRate =
    duesPaid + duesUnpaid > 0 ? Math.round((duesPaid / (duesPaid + duesUnpaid)) * 100) : null;

  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;
  const providers = [...byProvider.entries()].sort((a, b) => b[1].amount - a[1].amount);

  const rangeLabel = `${formatDate(start)} – ${formatDate(new Date(end.getTime() - DAY_MS))}`;
  const exportQuery = `from=${fromStr}&to=${toStr}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Income, signups and dues for the period you choose.</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {presets.map((preset) => {
            const active = preset.from === fromStr && preset.to === toStr;
            return (
              <Link
                key={preset.label}
                href={`/admin/dashboard/reports?from=${preset.from}&to=${preset.to}`}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-green bg-brand-green text-white"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
        </div>

        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
            <Input id="from" type="date" name="from" defaultValue={fromStr} max={today} />
          </div>
          <div className="space-y-1">
            <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
            <Input id="to" type="date" name="to" defaultValue={toStr} max={today} />
          </div>
          <Button type="submit" className="rounded-full bg-brand-green text-white hover:bg-brand-green/90">
            Apply
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">Showing {rangeLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatNaira(totalRevenue)}
          hint={`Wallet top-ups of ${formatNaira(topups._sum.amount ?? 0)} are not counted`}
        />
        <StatCard
          label="Activation fees"
          value={formatNaira(byPurpose.ACTIVATION.amount)}
          hint={`${byPurpose.ACTIVATION.count} activation${byPurpose.ACTIVATION.count === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Monthly dues collected"
          value={formatNaira(byPurpose.DUES.amount)}
          hint={`${byPurpose.DUES.count} payment${byPurpose.DUES.count === 1 ? "" : "s"}`}
        />
        <StatCard label="New signups" value={String(signups.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              How members paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments in this period.</p>
            ) : (
              <ul className="divide-y">
                {providers.map(([provider, data]) => (
                  <li key={provider} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{PROVIDER_LABELS[provider] ?? provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} payment{data.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatNaira(data.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dues that fell due in this period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-semibold">
              {collectionRate === null ? "—" : `${collectionRate}%`}
              <span className="ml-2 text-sm font-normal text-muted-foreground">collected</span>
            </p>
            <ul className="divide-y text-sm">
              <li className="flex justify-between py-2">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">{duesPaid}</span>
              </li>
              <li className="flex justify-between py-2">
                <span className="text-muted-foreground">Still unpaid</span>
                <span className="font-medium">
                  {duesUnpaid} ({formatNaira(duesUnpaidAmount)})
                </span>
              </li>
              <li className="flex justify-between py-2">
                <span className="text-muted-foreground">Waived</span>
                <span className="font-medium">{duesWaived}</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Waived months are left out of the percentage.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Month by month</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {monthRows.map((row) => {
              const total = row.activation + row.dues;
              return (
                <li key={row.key} className="space-y-1.5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{monthName(row.key)}</span>
                    <span className="font-semibold">{formatNaira(total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-green"
                      style={{ width: `${(total / maxMonth) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.signups} signup{row.signups === 1 ? "" : "s"} · Activation{" "}
                    {formatNaira(row.activation)} · Dues {formatNaira(row.dues)}
                  </p>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members right now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["ACTIVE", "PENDING", "LAPSED", "INACTIVE", "CANCELLED"].map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
                  {statusLabel(status)}
                </span>
                <span className="font-semibold">{statusCounts[status] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Download as CSV (opens in Excel or Google Sheets)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start rounded-full">
              <a href="/admin/dashboard/reports/export/members" download>
                <Download className="mr-2 h-4 w-4" />
                All members
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-full">
              <a href={`/admin/dashboard/reports/export/payments?${exportQuery}`} download>
                <Download className="mr-2 h-4 w-4" />
                Payments for {fromStr} to {toStr}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              These files contain personal details. Every download is recorded in the audit log.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
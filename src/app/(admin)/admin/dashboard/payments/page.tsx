import Link from "next/link";
import { Prisma, TransactionPurpose, TransactionStatus } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatNaira } from "@/lib/format";

export const metadata = { title: "Payments | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const PURPOSE_LABELS: Record<string, string> = {
  ACTIVATION: "Activation",
  TOPUP: "Wallet top-up",
  DUES: "Monthly dues",
  OTHER: "Other",
};

const STATUS_CLASSES: Record<string, string> = {
  COMPLETED: "bg-brand-mint text-brand-forest",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:w-auto";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASSES[status] ?? "bg-muted text-foreground"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

type SearchParams = {
  q?: string;
  purpose?: string;
  status?: string;
  page?: string;
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const purpose = Object.values(TransactionPurpose).includes(
    params.purpose as TransactionPurpose
  )
    ? (params.purpose as TransactionPurpose)
    : undefined;
  const status = Object.values(TransactionStatus).includes(
    params.status as TransactionStatus
  )
    ? (params.status as TransactionStatus)
    : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.TransactionWhereInput = {
    ...(purpose ? { purpose } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { providerReference: { contains: q, mode: "insensitive" } },
            {
              wallet: {
                user: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    {
                      membership: {
                        membershipNumber: { contains: q, mode: "insensitive" },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, transactions, completedSum] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                membership: { select: { membershipNumber: true } },
              },
            },
          },
        },
      },
    }),
    prisma.transaction.aggregate({
      where: { ...where, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (purpose) search.set("purpose", purpose);
    if (status) search.set("status", status);
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return `/admin/dashboard/payments${query ? `?${query}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Every transaction: card payments, wallet payments and cash or transfer
          payments you recorded.
        </p>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, ERK number or reference"
          className="sm:max-w-sm"
        />
        <select name="purpose" defaultValue={purpose ?? ""} className={selectClass}>
          <option value="">All types</option>
          {Object.values(TransactionPurpose).map((value) => (
            <option key={value} value={value}>
              {PURPOSE_LABELS[value] ?? value}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {Object.values(TransactionStatus).map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 rounded-full bg-brand-green text-white hover:bg-brand-green/90 sm:flex-none"
          >
            Filter
          </Button>
          {(q || purpose || status) && (
            <Button asChild variant="outline" className="flex-1 rounded-full sm:flex-none">
              <Link href="/admin/dashboard/payments">Clear</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {total} transaction{total === 1 ? "" : "s"}
        </span>
        <span>
          Completed total for this view:{" "}
          <strong className="text-foreground">
            {formatNaira(completedSum._sum.amount ?? 0)}
          </strong>
        </span>
      </div>

      {transactions.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No transactions match.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Phones and tablets: one card per transaction */}
          <div className="space-y-3 lg:hidden">
            {transactions.map((tx) => {
              const user = tx.wallet.user;
              return (
                <Card key={tx.id} className="rounded-2xl">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/dashboard/members/${user.id}`}
                          className="block truncate font-medium hover:text-brand-green"
                        >
                          {user.name ?? user.email}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {user.membership?.membershipNumber ?? "—"}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">{formatNaira(tx.amount)}</span>
                    </div>
                    <p className="text-sm">
                      {tx.description ??
                        (tx.purpose ? PURPOSE_LABELS[tx.purpose] : tx.type)}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2"><StatusBadge status={tx.status} /><Link href={`/admin/dashboard/payments/${tx.id}`} className="text-xs font-medium text-brand-green hover:underline">Details</Link></div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {tx.provider ?? "—"} · {tx.providerReference ?? "no reference"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Large screens: table */}
          <Card className="hidden rounded-2xl lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => {
                      const user = tx.wallet.user;
                      return (
                        <tr key={tx.id} className="align-top">
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {formatDateTime(tx.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/dashboard/members/${user.id}`}
                              className="font-medium hover:text-brand-green"
                            >
                              {user.name ?? user.email}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {user.membership?.membershipNumber ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p>
                              {tx.description ??
                                (tx.purpose ? PURPOSE_LABELS[tx.purpose] : tx.type)}
                            </p>
                            <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                              {tx.provider ?? "—"} · {tx.providerReference ?? "no reference"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2"><StatusBadge status={tx.status} /><Link href={`/admin/dashboard/payments/${tx.id}`} className="text-xs font-medium text-brand-green hover:underline">Details</Link></div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                            {formatNaira(tx.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-medium text-brand-green hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-medium text-brand-green hover:underline">
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
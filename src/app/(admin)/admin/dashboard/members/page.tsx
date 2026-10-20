import Link from "next/link";
import { MembershipStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNaira } from "@/lib/format";
import { statusBadgeClass, statusLabel } from "@/lib/membership-status";

export const metadata = { title: "Members | Easy Run Klub Admin" };

const PAGE_SIZE = 20;
const STATUSES = Object.values(MembershipStatus);

function buildHref(next: { q?: string; status?: string; page?: number }) {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return `/admin/dashboard/members${query ? `?${query}` : ""}`;
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = STATUSES.find((value) => value === params.status);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.UserWhereInput = {
    role: "MEMBER",
    ...(status && { membership: { is: { status } } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        {
          membership: {
            is: { membershipNumber: { contains: q, mode: "insensitive" } },
          },
        },
      ],
    }),
  };

  const [members, total, statusCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        membership: { select: { membershipNumber: true, status: true } },
        wallet: { select: { balance: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.membership.groupBy({
      by: ["status"],
      where: { user: { role: "MEMBER" } },
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countFor = (value: string) =>
    statusCounts.find((row) => row.status === value)?._count._all ?? 0;
  const allCount = statusCounts.reduce((sum, row) => sum + row._count._all, 0);

  const chips = [
    { label: "All", value: undefined, count: allCount },
    ...STATUSES.map((value) => ({
      label: statusLabel(value),
      value: value as string,
      count: countFor(value),
    })).filter((chip) => chip.count > 0),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Members
        </h1>
        <p className="text-muted-foreground">
          {allCount} member{allCount === 1 ? "" : "s"} in total.
        </p>
      </div>

      <form
        action="/admin/dashboard/members"
        method="get"
        className="flex flex-col gap-2 sm:flex-row"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, phone or membership ID"
          className="sm:max-w-md"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            Search
          </Button>
          {q && (
            <Button asChild variant="ghost" className="rounded-full">
              <Link href={buildHref({ status })}>Clear</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isCurrent = chip.value === status;
          return (
            <Link
              key={chip.label}
              href={buildHref({ q, status: chip.value })}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                isCurrent
                  ? "border-brand-forest bg-brand-forest text-white"
                  : "hover:bg-accent"
              }`}
            >
              {chip.label}{" "}
              <span className={isCurrent ? "text-white/70" : "text-muted-foreground"}>
                {chip.count}
              </span>
            </Link>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No members match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Membership ID</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Wallet</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/dashboard/members/${member.id}`}
                          className="font-medium text-brand-forest underline-offset-4 hover:underline"
                        >
                          {member.name ?? member.email}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {member.membership?.membershipNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                            member.membership?.status
                          )}`}
                        >
                          {statusLabel(member.membership?.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {formatNaira(member.wallet?.balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href={buildHref({ q, status, page: page - 1 })}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href={buildHref({ q, status, page: page + 1 })}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
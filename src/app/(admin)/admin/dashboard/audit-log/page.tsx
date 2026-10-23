import Link from "next/link";
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Audit Log | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  "member.activate_manual": "Member activated manually",
  "member.status_change": "Member status changed",
  "member.resend_verification": "Verification email re-sent",
  "dues.mark_paid": "Dues marked paid",
  "dues.waive": "Dues waived",
  "dues.refresh_all": "All dues refreshed",
  "announcement.create": "Announcement drafted",
  "announcement.publish": "Announcement published",
  "announcement.unpublish": "Announcement unpublished",
  "announcement.update": "Announcement edited",
  "announcement.pin": "Announcement pinned",
  "announcement.unpin": "Announcement unpinned",
  "announcement.delete": "Announcement deleted",
  "admin.add": "Admin added",
  "admin.remove": "Admin removed",
};

function targetHref(targetType: string | null, targetId: string | null) {
  if (!targetType || !targetId) return null;
  if (targetType === "member") return `/admin/dashboard/members/${targetId}`;
  if (targetType === "announcement")
    return `/admin/dashboard/communication/announcements/${targetId}`;
  return null;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.AuditLogWhereInput = q
    ? {
        OR: [
          { action: { contains: q, mode: "insensitive" } },
          { actor: { name: { contains: q, mode: "insensitive" } } },
          { actor: { email: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (target > 1) sp.set("page", String(target));
    const query = sp.toString();
    return `/admin/dashboard/audit-log${query ? `?${query}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          A record of every admin action: who did what, and when.
        </p>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by action or admin name/email"
          className="sm:max-w-sm"
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 rounded-full bg-brand-green text-white hover:bg-brand-green/90 sm:flex-none">
            Search
          </Button>
          {q && (
            <Button asChild variant="outline" className="flex-1 rounded-full sm:flex-none">
              <Link href="/admin/dashboard/audit-log">Clear</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} entr{total === 1 ? "y" : "ies"}
      </p>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => {
                const summary = (entry.details as { summary?: string } | null)?.summary;
                const href = targetHref(entry.targetType, entry.targetId);
                return (
                  <li key={entry.id} className="space-y-0.5 px-4 py-3 text-sm">
                    <p className="font-medium">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </p>
                    {summary && <p className="text-muted-foreground">{summary}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)} ·{" "}
                      {entry.actor?.name ?? entry.actor?.email ?? "Unknown"}
                      {href && (
                        <>
                          {" · "}
                          <Link href={href} className="text-brand-green hover:underline">
                            View
                          </Link>
                        </>
                      )}
                    </p>
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
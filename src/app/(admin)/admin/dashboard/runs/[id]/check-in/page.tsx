import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { CheckInConsole } from "@/components/admin/check-in-console";
import { formatRunWhen } from "@/lib/run-time";

export const metadata = { title: "Check-in | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;

export default async function RunCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const run = await prisma.run.findUnique({ where: { id } });
  if (!run) notFound();

  const [checkedIn, rsvps] = await Promise.all([
    prisma.runRsvp.count({ where: { runId: id, checkedInAt: { not: null } } }),
    prisma.runRsvp.count({ where: { runId: id } }),
  ]);

  const opens = new Date(run.startsAt.getTime() - 2 * HOUR_MS);
  const closes = new Date(run.startsAt.getTime() + 6 * HOUR_MS);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={`/admin/dashboard/runs/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to run
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="font-medium">{run.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatRunWhen(run.startsAt)} · {run.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open from {formatRunWhen(opens)} until {formatRunWhen(closes)}.
        </p>
      </div>

      <CheckInConsole runId={id} initialCheckedIn={checkedIn} initialRsvps={rsvps} />
    </div>
  );
}
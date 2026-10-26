import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Repeat } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { getHeadcounts, NO_COUNT } from "@/server/runs/headcount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunForm } from "@/components/admin/run-form";
import { RunCancelButton } from "@/components/admin/run-buttons";
import { FREQUENCY_LABELS, formatRunWhen, toLagosInputs } from "@/lib/run-time";

export const metadata = { title: "Run | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      series: { select: { frequency: true } },
      rsvps: {
        orderBy: { createdAt: "asc" },
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
  });
  if (!run) notFound();

  const counts = await getHeadcounts([id]);
  const count = counts.get(id) ?? NO_COUNT;
  const inputs = toLagosInputs(run.startsAt);
  const cancelled = run.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/dashboard/runs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Runs & Events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{run.title}</h1>
            {cancelled && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Cancelled
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {formatRunWhen(run.startsAt)} · {run.location}
          </p>
          {run.series && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />
              Part of a repeating run: {FREQUENCY_LABELS[run.series.frequency]}
            </p>
          )}
        </div>
        <RunCancelButton id={run.id} cancelled={cancelled} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Edit run</CardTitle>
        </CardHeader>
        <CardContent>
          <RunForm
            run={{
              id: run.id,
              title: run.title,
              description: run.description ?? "",
              location: run.location,
              date: inputs.date,
              time: inputs.time,
              capacity: run.capacity?.toString() ?? "",
              guestsAllowed: run.guestsAllowed,
              maxGuests: run.maxGuestsPerMember,
              inSeries: run.seriesId !== null,
              flyerPath: run.flyerPath,
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>Who&apos;s coming</span>
            <span className="text-base font-semibold text-foreground">
              {count.headcount}
              {run.capacity ? ` / ${run.capacity}` : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {run.rsvps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody has signed up yet.</p>
          ) : (
            <ul className="divide-y">
              {run.rsvps.map((rsvp) => (
                <li key={rsvp.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/dashboard/members/${rsvp.user.id}`}
                      className="block truncate font-medium hover:text-brand-green"
                    >
                      {rsvp.user.name ?? rsvp.user.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {rsvp.user.membership?.membershipNumber ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {rsvp.guests > 0 ? `+${rsvp.guests} guest${rsvp.guests === 1 ? "" : "s"}` : "No guests"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
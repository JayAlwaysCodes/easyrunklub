import Link from "next/link";
import { Repeat, Users } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { generateOccurrences } from "@/server/runs/generate";
import { getHeadcounts, NO_COUNT } from "@/server/runs/headcount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EndSeriesButton } from "@/components/admin/run-buttons";
import { FREQUENCY_LABELS, formatRunWhen } from "@/lib/run-time";

export const metadata = { title: "Runs & Events | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "past" ? "past" : "upcoming";
  const now = new Date();

  await generateOccurrences();

  const [runs, activeSeries] = await Promise.all([
    prisma.run.findMany({
      where: view === "upcoming" ? { startsAt: { gte: now } } : { startsAt: { lt: now } },
      orderBy: { startsAt: view === "upcoming" ? "asc" : "desc" },
      take: 60,
      include: { series: { select: { frequency: true } } },
    }),
    prisma.runSeries.findMany({
      where: { OR: [{ endsOn: null }, { endsOn: { gte: now } }] },
      orderBy: { createdAt: "desc" },
      include: {
        runs: {
          where: { startsAt: { gte: now }, status: "SCHEDULED" },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
      },
    }),
  ]);
  const counts = await getHeadcounts(runs.map((r) => r.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Runs & Events</h1>
          <p className="text-muted-foreground">Schedule runs and see who&apos;s coming.</p>
        </div>
        <Button asChild className="rounded-full bg-brand-green text-white hover:bg-brand-green/90">
          <Link href="/admin/dashboard/runs/new">New run</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((key) => (
          <Link
            key={key}
            href={`/admin/dashboard/runs?view=${key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              view === key
                ? "border-brand-green bg-brand-green text-white"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {key === "upcoming" ? "Upcoming" : "Past"}
          </Link>
        ))}
      </div>

      {runs.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {view === "upcoming" ? "No upcoming runs. Create one." : "No past runs yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const count = counts.get(run.id) ?? NO_COUNT;
            return (
              <Link key={run.id} href={`/admin/dashboard/runs/${run.id}`} className="block">
                <Card className="rounded-2xl transition-colors hover:bg-muted/40">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{run.title}</p>
                      {run.status === "CANCELLED" && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Cancelled
                        </span>
                      )}
                      {run.series && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Repeat className="h-3 w-3" />
                          {FREQUENCY_LABELS[run.series.frequency]}
                        </span>
                      )}
                      {run.guestsAllowed && (
                        <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-medium text-brand-forest">
                          Bring a friend
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatRunWhen(run.startsAt)} · {run.location}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-sm">
                      <Users className="h-4 w-4 text-brand-green" />
                      {count.headcount}
                      {run.capacity ? ` / ${run.capacity}` : ""} going
                      {count.guests > 0 && (
                        <span className="text-muted-foreground"> (incl. {count.guests} guest{count.guests === 1 ? "" : "s"})</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {activeSeries.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Repeating runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {activeSeries.map((series) => (
                <li
                  key={series.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{series.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[series.frequency]} ·{" "}
                      {series.runs[0] ? `next: ${formatRunWhen(series.runs[0].startsAt)}` : "no upcoming dates"}
                    </p>
                  </div>
                  <EndSeriesButton seriesId={series.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import Image from "next/image";
import { CalendarDays, MapPin, Repeat, Users } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { requireActiveMember } from "@/server/membership/access";
import { generateOccurrences } from "@/server/runs/generate";
import { getHeadcounts, NO_COUNT } from "@/server/runs/headcount";
import { Card, CardContent } from "@/components/ui/card";
import { RsvpForm } from "@/components/dashboard/rsvp-form";
import { flyerUrl } from "@/lib/uploads";
import { formatRunWhen } from "@/lib/run-time";

export const metadata = { title: "Upcoming Runs | Easy Run Klub" };
export const dynamic = "force-dynamic";

export default async function MemberRunsPage() {
  const { userId } = await requireActiveMember();

  await generateOccurrences();

  const runs = await prisma.run.findMany({
    where: { status: "SCHEDULED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 40,
  });
  const runIds = runs.map((run) => run.id);

  const [counts, myRsvps] = await Promise.all([
    getHeadcounts(runIds),
    prisma.runRsvp.findMany({
      where: { userId, runId: { in: runIds } },
      select: { runId: true, guests: true },
    }),
  ]);
  const mine = new Map(myRsvps.map((rsvp) => [rsvp.runId, rsvp.guests]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Upcoming Runs</h1>
        <p className="text-muted-foreground">Let us know which runs you&apos;re coming to.</p>
      </div>

      {runs.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
            No runs are scheduled yet. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const count = counts.get(run.id) ?? NO_COUNT;
            const myGuests = mine.has(run.id) ? (mine.get(run.id) as number) : null;
            const spotsLeft = run.capacity === null ? null : run.capacity - count.headcount;
            const flyer = flyerUrl(run.flyerPath);

            return (
              <Card key={run.id} className="overflow-hidden rounded-2xl">
                {flyer && (
                  <div className="relative h-56 w-full bg-brand-mint/30">
                    <Image
                      src={flyer}
                      alt={`${run.title} flyer`}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                )}
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold">{run.title}</h2>
                    {myGuests !== null && (
                      <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-semibold text-brand-forest">
                        You&apos;re going
                        {myGuests > 0 ? ` (+${myGuests} guest${myGuests === 1 ? "" : "s"})` : ""}
                      </span>
                    )}
                    {run.guestsAllowed && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        Bring a friend
                      </span>
                    )}
                    {run.seriesId && (
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" aria-label="Repeating run" />
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatRunWhen(run.startsAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {run.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {run.capacity === null
                        ? `${count.headcount} going · open to everyone`
                        : spotsLeft !== null && spotsLeft > 0
                          ? `${count.headcount} going · ${spotsLeft} of ${run.capacity} spots left`
                          : `${count.headcount} going · full`}
                    </p>
                  </div>

                  {run.description && (
                    <p className="whitespace-pre-line text-sm leading-relaxed">{run.description}</p>
                  )}

                  <RsvpForm
                    runId={run.id}
                    guestsAllowed={run.guestsAllowed}
                    maxGuests={run.maxGuestsPerMember}
                    myGuests={myGuests}
                    spotsLeft={spotsLeft}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
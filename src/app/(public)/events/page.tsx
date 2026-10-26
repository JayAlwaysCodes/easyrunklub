import type { Metadata } from "next";

import { getPublicUpcomingRuns } from "@/server/runs/public";
import { EventImage } from "@/components/events/event-image";
import { FREQUENCY_LABELS, formatRunWhen } from "@/lib/run-time";

export const metadata: Metadata = {
  title: "Events | Easy Run Klub",
};

// Always fresh: new runs and cancellations show up straight away.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublicUpcomingRuns(30);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        Upcoming Events
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Join us at one of our upcoming runs — all paces and abilities
        welcome.
      </p>

      {events.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No runs are scheduled right now. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-2xl border bg-background"
            >
              <div className="relative h-64 w-full bg-brand-mint/30">
                <EventImage
                  flyerPath={event.flyerPath}
                  title={event.title}
                  index={index}
                />
              </div>
              <div className="space-y-2 p-5">
                <h2 className="font-medium">{event.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatRunWhen(event.startsAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.series && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[event.series.frequency]}
                    </span>
                  )}
                  {event.guestsAllowed && (
                    <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-medium text-brand-forest">
                      Bring a friend
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="line-clamp-3 pt-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import Link from "next/link";

import { getPublicUpcomingRuns } from "@/server/runs/public";
import { EventImage } from "@/components/events/event-image";
import { formatRunWhen } from "@/lib/run-time";

export async function UpcomingEventsSection() {
  const previewEvents = await getPublicUpcomingRuns(3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold md:text-3xl">
          Upcoming Events
        </h2>
        <Link
          href="/events"
          className="rounded-full bg-brand-mint px-4 py-1.5 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-mint/70"
        >
          View more
        </Link>
      </div>

      {previewEvents.length === 0 ? (
        <p className="text-muted-foreground">
          No runs are scheduled right now. Check back soon!
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {previewEvents.map((event, index) => (
            <div key={event.id} className="space-y-3">
              <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-brand-mint/30">
                <EventImage
                  flyerPath={event.flyerPath}
                  title={event.title}
                  index={index}
                />
              </div>
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatRunWhen(event.startsAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
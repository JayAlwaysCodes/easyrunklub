import Image from "next/image";
import Link from "next/link";

import { EVENTS } from "@/lib/placeholder-data/events";

export function UpcomingEventsSection() {
  const previewEvents = EVENTS.slice(0, 3);

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

      <div className="grid gap-6 md:grid-cols-3">
        {previewEvents.map((event) => (
          <div key={event.id} className="space-y-3">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.date}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
import Image from "next/image";
import type { Metadata } from "next";

import { EVENTS } from "@/lib/placeholder-data/events";

export const metadata: Metadata = {
  title: "Events | Easy Run Klub",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        Upcoming Events
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Join us at one of our upcoming runs — all paces and abilities
        welcome.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {EVENTS.map((event) => (
          <div
            key={event.id}
            className="overflow-hidden rounded-2xl border bg-background"
          >
            <div className="relative h-48 w-full">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-5">
              <h2 className="font-medium">{event.title}</h2>
              <p className="text-sm text-muted-foreground">{event.date}</p>
              <p className="text-sm text-muted-foreground">
                {event.location}
              </p>
              <p className="pt-2 text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
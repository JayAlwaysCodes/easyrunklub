// Placeholder event data — shaped so a future admin upload feature can
// populate this from the database instead of this hardcoded array. Both
// the homepage preview and the full events page read from this one file.

export type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
};

export const EVENTS: EventItem[] = [
  {
    id: "1",
    title: "10km Uyo, Akwa Ibom City Run",
    date: "Tue, Sep 22 · 8:00 AM",
    location: "Akwa Ibom, Nigeria",
    description:
      "Join fellow runners for a 10km city run through Uyo. All paces welcome — this is a community run, not a race against the clock.",
    image: "/events/event-1.jpeg",
  },
  {
    id: "2",
    title: "10km Uyo, Akwa Ibom City Run",
    date: "Tue, Sep 22 · 8:00 AM",
    location: "Akwa Ibom, Nigeria",
    description:
      "Join fellow runners for a 10km city run through Uyo. All paces welcome — this is a community run, not a race against the clock.",
    image: "/events/event-2.jpeg",
  },
  {
    id: "3",
    title: "10km Uyo, Akwa Ibom City Run",
    date: "Tue, Sep 22 · 8:00 AM",
    location: "Akwa Ibom, Nigeria",
    description:
      "Join fellow runners for a 10km city run through Uyo. All paces welcome — this is a community run, not a race against the clock.",
    image: "/events/event-3.jpeg",
  },
];
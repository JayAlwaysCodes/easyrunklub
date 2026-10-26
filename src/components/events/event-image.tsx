import Image from "next/image";

import { flyerUrl } from "@/lib/uploads";

// Your existing placeholder photos, used when a run has no flyer yet.
const FALLBACKS = ["/events/event-1.jpeg", "/events/event-2.jpeg", "/events/event-3.jpeg"];

export function EventImage({
  flyerPath,
  title,
  index,
}: {
  flyerPath: string | null;
  title: string;
  index: number;
}) {
  const url = flyerUrl(flyerPath);

  // Flyers are shown whole (never cropped) so their text stays readable.
  if (url) {
    return (
      <Image
        src={url}
        alt={`${title} flyer`}
        fill
        unoptimized
        className="object-contain"
      />
    );
  }

  return (
    <Image
      src={FALLBACKS[index % FALLBACKS.length]}
      alt={title}
      fill
      sizes="(min-width: 768px) 33vw, 100vw"
      className="object-cover"
    />
  );
}
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

// Placeholder data — shaped so a future admin upload feature can populate
// this from the database. `type` anticipates video items: a video item
// would autoplay (muted, looped) inline in the small carousel frame, and
// still open full-size in the lightbox on click, same as an image does.
type CommunityItem = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
};

const COMMUNITY_ITEMS: CommunityItem[] = [
  { id: "1", type: "image", src: "/community/community-1.jpeg", alt: "Easy Run Klub community" },
  { id: "2", type: "image", src: "/community/community-2.jpeg", alt: "Easy Run Klub community" },
  { id: "3", type: "image", src: "/community/community-3.jpeg", alt: "Easy Run Klub community" },
  { id: "4", type: "image", src: "/community/community-4.jpeg", alt: "Easy Run Klub community" },
  { id: "5", type: "image", src: "/community/community-5.jpeg", alt: "Easy Run Klub community" },
  { id: "6", type: "image", src: "/community/community-6.jpeg", alt: "Easy Run Klub community" },
];

const SLIDE_DURATION_MS = 5000;

export function CommunitySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % COMMUNITY_ITEMS.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  const activeItem = COMMUNITY_ITEMS[activeIndex];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold md:text-3xl">
          Meet the Community
        </h2>
        <Link
          href="/gallery"
          className="rounded-full bg-brand-mint px-4 py-1.5 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-mint/70"
        >
          View more
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block h-72 w-full overflow-hidden rounded-2xl md:h-[420px]"
      >
        {COMMUNITY_ITEMS.map((item, index) => (
          <Image
            key={item.id}
            src={item.src}
            alt={item.alt}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </button>

      <div className="mt-4 flex justify-center gap-2">
        {COMMUNITY_ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === activeIndex ? "bg-brand-forest" : "bg-brand-forest/25"
            }`}
          />
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Community photo</DialogTitle>
          </VisuallyHidden>
          <div className="relative h-[90vh] w-full overflow-hidden rounded-xl">
            <Image
              src={activeItem.src}
              alt={activeItem.alt}
              fill
              className="object-contain bg-black"
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
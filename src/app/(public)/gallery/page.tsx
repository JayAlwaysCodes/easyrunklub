"use client";

import { useState } from "react";
import Image from "next/image";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { GALLERY_ITEMS } from "@/lib/placeholder-data/gallery";

export default function GalleryPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const approvedItems = GALLERY_ITEMS.filter(
    (item) => item.status === "approved"
  );
  const activeItem = approvedItems.find((item) => item.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        Our Gallery
      </h1>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {approvedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className="relative aspect-square overflow-hidden rounded-xl"
          >
            <Image
              src={item.src}
              alt="Easy Run Klub gallery photo"
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={activeId !== null} onOpenChange={() => setActiveId(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Gallery photo</DialogTitle>
          </VisuallyHidden>
          {activeItem && (
            <div className="relative h-[80vh] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={activeItem.src}
                alt="Easy Run Klub gallery photo"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
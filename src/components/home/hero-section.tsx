"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const HERO_IMAGES = [
  "/hero/hero-1.jpeg",
  "/hero/hero-2.jpeg",
  "/hero/hero-3.jpeg",
  "/hero/hero-4.jpeg",
];

const SLIDE_DURATION_MS = 5000;

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="relative h-[calc(100vh-4rem)] min-h-[500px] w-full overflow-hidden rounded-3xl">
        {HERO_IMAGES.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt="Easy Run Klub community running together"
            fill
            priority={index === 0}
            className={`object-cover transition-opacity duration-1000 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-12">
          <p className="text-xs font-medium uppercase tracking-widest text-white/80 md:text-sm">
            Welcome to Easy Run Klub
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold leading-tight md:text-6xl">
            Fun and Fitness 4Life
            <br />
            Let&apos;s go there
          </h1>
          <p className="mt-4 text-sm text-white/80 md:hidden">Swipe down</p>
        </div>
      </div>
    </section>
  );
}
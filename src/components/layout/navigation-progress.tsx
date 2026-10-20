"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SAFETY_TIMEOUT_MS = 15000;

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const active = useRef(false);
  const crawl = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (crawl.current) clearInterval(crawl.current);
    if (hide.current) clearTimeout(hide.current);
    if (safety.current) clearTimeout(safety.current);
  }

  function finish() {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }

  function start() {
    clearTimers();
    active.current = true;
    setVisible(true);
    setProgress(12);
    // Creep towards 90% while we wait; it only hits 100% when the page arrives.
    crawl.current = setInterval(() => {
      setProgress((p) => p + (90 - p) * 0.08);
    }, 200);
    safety.current = setTimeout(finish, SAFETY_TIMEOUT_MS);
  }

  // The new page has arrived.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Start on any click on an internal link that goes to a different page.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      start();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[110] h-1 bg-brand-green shadow-[0_0_8px] shadow-brand-green/60 transition-[width,opacity] duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ width: `${progress}%` }}
    />
  );
}
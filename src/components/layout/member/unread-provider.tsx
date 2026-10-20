"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getUnreadAnnouncementCount } from "@/server/announcements/actions";

const POLL_MS = 60_000;

type UnreadContextValue = { unread: number; clear: () => void };

const UnreadContext = createContext<UnreadContextValue>({
  unread: 0,
  clear: () => {},
});

export function UnreadProvider({
  initial,
  children,
}: {
  initial: number;
  children: React.ReactNode;
}) {
  const [unread, setUnread] = useState(initial);
  const clear = useCallback(() => setUnread(0), []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const count = await getUnreadAnnouncementCount();
        if (!cancelled) setUnread(count);
      } catch {
        // Network hiccup: try again next time.
      }
    }

    const interval = setInterval(refresh, POLL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const value = useMemo(() => ({ unread, clear }), [unread, clear]);
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnreadAnnouncements() {
  return useContext(UnreadContext);
}
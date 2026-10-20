"use client";

import { useEffect } from "react";

import { markAnnouncementsSeen } from "@/server/announcements/actions";
import { useUnreadAnnouncements } from "@/components/layout/member/unread-provider";

// Rendered on the Announcements page: once it's open, everything counts as read.
export function MarkAnnouncementsSeen() {
  const { clear } = useUnreadAnnouncements();

  useEffect(() => {
    markAnnouncementsSeen()
      .then(clear)
      .catch(() => {});
  }, [clear]);

  return null;
}
"use server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { countUnreadAnnouncements } from "@/server/announcements/unread";

export async function markAnnouncementsSeen(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { announcementsSeenAt: new Date() },
  });
}

export async function getUnreadAnnouncementCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return countUnreadAnnouncements(session.user.id);
}
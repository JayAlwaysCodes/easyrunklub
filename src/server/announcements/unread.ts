import { prisma } from "@/server/db/prisma";

// A member's baseline is the last time they opened Announcements, or the
// day they joined if they never have. So new members don't get a red dot
// for posts from before they existed.
export async function getAnnouncementsBaseline(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { announcementsSeenAt: true, createdAt: true },
  });
  return user ? (user.announcementsSeenAt ?? user.createdAt) : new Date();
}

export async function countUnreadAnnouncements(userId: string) {
  const baseline = await getAnnouncementsBaseline(userId);
  return prisma.announcement.count({
    where: { publishedAt: { gt: baseline } },
  });
}
import { Megaphone, Pin } from "lucide-react";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { getAnnouncementsBaseline } from "@/server/announcements/unread";
import { Card, CardContent } from "@/components/ui/card";
import { MarkAnnouncementsSeen } from "@/components/dashboard/mark-announcements-seen";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Announcements | Easy Run Klub" };
export const dynamic = "force-dynamic";

export default async function MemberAnnouncementsPage() {
  const session = await auth();
  // Read the baseline BEFORE it's updated, so we know what's new.
  const baseline = session?.user?.id
    ? await getAnnouncementsBaseline(session.user.id)
    : new Date();

  const announcements = await prisma.announcement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 30,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <MarkAnnouncementsSeen />

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">News and updates from the club.</p>
      </div>

      {announcements.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Megaphone className="h-5 w-5" />
            No announcements yet. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const isNew = a.publishedAt ? a.publishedAt > baseline : false;
            return (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold">{a.title}</h2>
                    <div className="flex shrink-0 items-center gap-2">
                      {isNew && (
                        <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                          New
                        </span>
                      )}
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-medium text-brand-forest">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.publishedAt ? formatDate(a.publishedAt) : ""}
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{a.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
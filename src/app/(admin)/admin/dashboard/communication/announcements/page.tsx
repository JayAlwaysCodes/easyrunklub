import Link from "next/link";
import { ArrowLeft, Pin } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementRowActions } from "@/components/admin/announcement-row-actions";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Announcements | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { author: { select: { name: true, email: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/dashboard/communication"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Communication
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Published announcements appear in every member&apos;s dashboard.
          </p>
        </div>
        <Button asChild className="rounded-full bg-brand-green text-white hover:bg-brand-green/90">
          <Link href="/admin/dashboard/communication/announcements/new">New announcement</Link>
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No announcements yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const published = Boolean(a.publishedAt);
            return (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        published ? "bg-brand-mint text-brand-forest" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {published ? "Published" : "Draft"}
                    </span>
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {published
                        ? `Published ${formatDateTime(a.publishedAt!)}`
                        : `Created ${formatDateTime(a.createdAt)}`}{" "}
                      · {a.author.name ?? a.author.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/admin/dashboard/communication/announcements/${a.id}`}>Edit</Link>
                    </Button>
                    <AnnouncementRowActions id={a.id} published={published} pinned={a.pinned} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
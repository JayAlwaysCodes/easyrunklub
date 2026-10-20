import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const metadata = { title: "Edit announcement | Easy Run Klub Admin" };

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/dashboard/communication/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Announcements
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit announcement</h1>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <AnnouncementForm
            announcement={{
              id: announcement.id,
              title: announcement.title,
              body: announcement.body,
              pinned: announcement.pinned,
              published: Boolean(announcement.publishedAt),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
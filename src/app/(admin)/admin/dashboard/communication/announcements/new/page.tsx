import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const metadata = { title: "New announcement | Easy Run Klub Admin" };

export default function NewAnnouncementPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/dashboard/communication/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Announcements
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New announcement</h1>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <AnnouncementForm />
        </CardContent>
      </Card>
    </div>
  );
}
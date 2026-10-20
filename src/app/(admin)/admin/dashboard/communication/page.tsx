import Link from "next/link";
import { Megaphone, Mail, MessageSquare } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Communication | Easy Run Klub Admin" };

export default function CommunicationHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Communication</h1>
        <p className="text-muted-foreground">Reach your members.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/dashboard/communication/announcements">
          <Card className="h-full rounded-2xl transition-colors hover:bg-muted/40">
            <CardContent className="space-y-2 pt-6">
              <Megaphone className="h-6 w-6 text-brand-green" />
              <p className="font-semibold">Announcements</p>
              <p className="text-sm text-muted-foreground">
                Post news members read in their dashboard.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full rounded-2xl opacity-60">
          <CardContent className="space-y-2 pt-6">
            <Mail className="h-6 w-6" />
            <p className="font-semibold">
              Bulk email{" "}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                Soon
              </span>
            </p>
            <p className="text-sm text-muted-foreground">Email all or some members.</p>
          </CardContent>
        </Card>

        <Card className="h-full rounded-2xl opacity-60">
          <CardContent className="space-y-2 pt-6">
            <MessageSquare className="h-6 w-6" />
            <p className="font-semibold">
              Bulk SMS{" "}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                Soon
              </span>
            </p>
            <p className="text-sm text-muted-foreground">Text all or some members.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
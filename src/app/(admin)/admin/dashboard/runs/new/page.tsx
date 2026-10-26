import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { RunForm } from "@/components/admin/run-form";

export const metadata = { title: "New run | Easy Run Klub Admin" };

export default function NewRunPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/dashboard/runs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Runs & Events
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New run</h1>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <RunForm />
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Button } from "@/components/ui/button";

export default function MemberDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred loading your dashboard."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
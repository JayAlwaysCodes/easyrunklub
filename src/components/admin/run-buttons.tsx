"use client";

import { Button } from "@/components/ui/button";
import { endSeries, setRunCancelled } from "@/server/admin/run-actions";

function confirmSubmit(message: string) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
}

export function RunCancelButton({ id, cancelled }: { id: string; cancelled: boolean }) {
  return (
    <form
      action={setRunCancelled}
      onSubmit={confirmSubmit(
        cancelled
          ? "Reinstate this run? Members will see it again."
          : "Cancel this run? Members will no longer see it."
      )}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="cancel" value={cancelled ? "0" : "1"} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className={`rounded-full ${cancelled ? "" : "text-destructive hover:text-destructive"}`}
      >
        {cancelled ? "Reinstate run" : "Cancel run"}
      </Button>
    </form>
  );
}

export function EndSeriesButton({ seriesId }: { seriesId: string }) {
  return (
    <form
      action={endSeries}
      onSubmit={confirmSubmit(
        "End this repeating run? All of its future runs will be cancelled and no new ones will be created."
      )}
    >
      <input type="hidden" name="seriesId" value={seriesId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="rounded-full text-destructive hover:text-destructive"
      >
        End series
      </Button>
    </form>
  );
}
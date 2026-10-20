"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveAnnouncement,
  type AnnouncementActionState,
} from "@/server/admin/announcement-actions";

const initialState: AnnouncementActionState = {};

export function AnnouncementForm({
  announcement,
}: {
  announcement?: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    published: boolean;
  };
}) {
  const [state, formAction, isPending] = useActionState(saveAnnouncement, initialState);
  const isPublished = announcement?.published ?? false;

  return (
    <form action={formAction} className="space-y-4">
      {announcement && <input type="hidden" name="id" value={announcement.id} />}

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={announcement?.title ?? ""}
          placeholder="e.g. Saturday long run moved to 6:00am"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          maxLength={5000}
          defaultValue={announcement?.body ?? ""}
          placeholder="Write your announcement. Line breaks are kept."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <p className="text-xs text-muted-foreground">Plain text only.</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="pinned"
          defaultChecked={announcement?.pinned ?? false}
          className="h-4 w-4 accent-[var(--color-brand-green)]"
        />
        Pin to the top for members
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        {isPublished ? (
          <Button
            type="submit"
            name="intent"
            value="save"
            disabled={isPending}
            className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              name="intent"
              value="publish"
              disabled={isPending}
              className="rounded-full bg-brand-green text-white hover:bg-brand-green/90"
            >
              {isPending ? "Saving..." : "Publish now"}
            </Button>
            <Button
              type="submit"
              name="intent"
              value="save"
              variant="outline"
              disabled={isPending}
              className="rounded-full"
            >
              Save as draft
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
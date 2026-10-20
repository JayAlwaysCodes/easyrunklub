"use client";

import {
  deleteAnnouncement,
  setAnnouncementPinned,
  setAnnouncementPublished,
} from "@/server/admin/announcement-actions";
import { Button } from "@/components/ui/button";

function confirmSubmit(message: string) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
}

export function AnnouncementRowActions({
  id,
  published,
  pinned,
}: {
  id: string;
  published: boolean;
  pinned: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form
        action={setAnnouncementPublished}
        onSubmit={confirmSubmit(
          published
            ? "Unpublish this? Members will no longer see it."
            : "Publish this? Members will see it right away."
        )}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="publish" value={published ? "0" : "1"} />
        <Button type="submit" size="sm" variant="outline" className="rounded-full">
          {published ? "Unpublish" : "Publish"}
        </Button>
      </form>

      <form action={setAnnouncementPinned}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="pin" value={pinned ? "0" : "1"} />
        <Button type="submit" size="sm" variant="outline" className="rounded-full">
          {pinned ? "Unpin" : "Pin"}
        </Button>
      </form>

      <form
        action={deleteAnnouncement}
        onSubmit={confirmSubmit("Delete this announcement permanently?")}
      >
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="rounded-full text-destructive hover:text-destructive"
        >
          Delete
        </Button>
      </form>
    </div>
  );
}
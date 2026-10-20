"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { announcementSchema } from "@/validators/announcement";

export type AnnouncementActionState = { error?: string };

const LIST_PATH = "/admin/dashboard/communication/announcements";

function refresh() {
  revalidatePath(LIST_PATH);
  revalidatePath("/dashboard/announcements");
}

// Create or edit. intent = "publish" publishes it; "save" keeps the
// current state (a new announcement stays a draft).
export async function saveAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  let adminId: string;
  try {
    adminId = (await requireAdmin()).userId;
  } catch {
    return { error: "You don't have permission to do this." };
  }

  const id = String(formData.get("id") ?? "");
  const publish = formData.get("intent") === "publish";
  const pinned = formData.get("pinned") === "on";

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { title, body } = parsed.data;

  try {
    if (id) {
      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) return { error: "Announcement not found." };

      const publishingNow = publish && !existing.publishedAt;
      await prisma.announcement.update({
        where: { id },
        data: {
          title,
          body,
          pinned,
          ...(publishingNow ? { publishedAt: new Date() } : {}),
        },
      });

      await logAudit({
        actorId: adminId,
        action: publishingNow ? "announcement.publish" : "announcement.update",
        targetType: "announcement",
        targetId: id,
        details: { summary: `${publishingNow ? "Published" : "Edited"} “${title}”` },
      });
    } else {
      const created = await prisma.announcement.create({
        data: {
          title,
          body,
          pinned,
          authorId: adminId,
          publishedAt: publish ? new Date() : null,
        },
      });

      await logAudit({
        actorId: adminId,
        action: publish ? "announcement.publish" : "announcement.create",
        targetType: "announcement",
        targetId: created.id,
        details: {
          summary: `${publish ? "Created and published" : "Saved draft"} “${title}”`,
        },
      });
    }
  } catch (error) {
    console.error("saveAnnouncement failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  refresh();
  redirect(LIST_PATH);
}

export async function setAnnouncementPublished(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "1";

  const updated = await prisma.announcement.update({
    where: { id },
    data: { publishedAt: publish ? new Date() : null },
  });

  await logAudit({
    actorId: userId,
    action: publish ? "announcement.publish" : "announcement.unpublish",
    targetType: "announcement",
    targetId: id,
    details: { summary: `${publish ? "Published" : "Unpublished"} “${updated.title}”` },
  });
  refresh();
}

export async function setAnnouncementPinned(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pin = formData.get("pin") === "1";

  const updated = await prisma.announcement.update({
    where: { id },
    data: { pinned: pin },
  });

  await logAudit({
    actorId: userId,
    action: pin ? "announcement.pin" : "announcement.unpin",
    targetType: "announcement",
    targetId: id,
    details: { summary: `${pin ? "Pinned" : "Unpinned"} “${updated.title}”` },
  });
  refresh();
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.announcement.delete({ where: { id } });

  await logAudit({
    actorId: userId,
    action: "announcement.delete",
    targetType: "announcement",
    targetId: id,
    details: { summary: `Deleted “${existing.title}”` },
  });
  refresh();
}
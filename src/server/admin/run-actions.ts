"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { generateOccurrences } from "@/server/runs/generate";
import { getHeadcounts, NO_COUNT } from "@/server/runs/headcount";
import { uploadExists } from "@/server/storage";
import { FLYER_PATH_RE } from "@/lib/uploads";
import { lagosDateTimeToDate } from "@/lib/run-time";
import { runSchema } from "@/validators/run";

export type RunActionState = { error?: string };

const LIST_PATH = "/admin/dashboard/runs";

function refresh(runId?: string) {
  revalidatePath(LIST_PATH);
  if (runId) revalidatePath(`${LIST_PATH}/${runId}`);
  revalidatePath("/dashboard/runs");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function saveRun(
  _prev: RunActionState,
  formData: FormData
): Promise<RunActionState> {
  let adminId: string;
  try {
    adminId = (await requireAdmin()).userId;
  } catch {
    return { error: "You don't have permission to do this." };
  }

  const id = String(formData.get("id") ?? "");
  const parsed = runSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    location: formData.get("location") ?? "",
    date: formData.get("date") ?? "",
    time: formData.get("time") ?? "",
    capacity: formData.get("capacity") ?? "",
    guestsAllowed: formData.get("guestsAllowed") === "on",
    maxGuests: formData.get("maxGuests") ?? "1",
    repeat: formData.get("repeat") ?? "none",
    repeatUntil: formData.get("repeatUntil") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const input = parsed.data;
  const startsAt = lagosDateTimeToDate(input.date, input.time);
  if (!startsAt) return { error: "That date or time isn't valid." };

  const capacity = input.capacity === "" ? null : Number(input.capacity);
  const maxGuests = Number(input.maxGuests);
  const description = input.description === "" ? null : input.description;

  // The flyer was uploaded separately; here we only accept a real stored file.
  const flyerRaw = String(formData.get("flyerPath") ?? "");
  if (flyerRaw !== "" && (!FLYER_PATH_RE.test(flyerRaw) || !(await uploadExists(flyerRaw)))) {
    return { error: "The flyer upload didn't go through. Please upload it again." };
  }
  const flyerPath = flyerRaw === "" ? null : flyerRaw;

  const template = {
    title: input.title,
    description,
    location: input.location,
    capacity,
    flyerPath,
    guestsAllowed: input.guestsAllowed,
    maxGuestsPerMember: maxGuests,
  };

  let savedId = id;

  try {
    if (!id) {
      // ---------- Create ----------
      if (startsAt <= new Date()) {
        return { error: "Pick a date and time in the future." };
      }

      if (input.repeat === "none") {
        const run = await prisma.run.create({ data: { ...template, startsAt } });
        savedId = run.id;
        await logAudit({
          actorId: adminId,
          action: "run.create",
          targetType: "run",
          targetId: run.id,
          details: { summary: `Created run “${input.title}”` },
        });
      } else {
        let endsOn: Date | null = null;
        if (input.repeatUntil) {
          endsOn = lagosDateTimeToDate(input.repeatUntil, "23:59");
          if (!endsOn) return { error: "That “repeat until” date isn't valid." };
          if (endsOn < startsAt) {
            return { error: "“Repeat until” must be after the first run." };
          }
        }

        const series = await prisma.runSeries.create({
          data: { ...template, frequency: input.repeat, firstRunAt: startsAt, endsOn },
        });
        await generateOccurrences(series.id);

        await logAudit({
          actorId: adminId,
          action: "run.create_series",
          targetType: "run_series",
          targetId: series.id,
          details: {
            summary: `Created repeating run “${input.title}” (${input.repeat.toLowerCase()})`,
          },
        });
      }
    } else {
      // ---------- Edit ----------
      const existing = await prisma.run.findUnique({ where: { id } });
      if (!existing) return { error: "Run not found." };

      if (capacity !== null) {
        const counts = await getHeadcounts([id]);
        const headcount = (counts.get(id) ?? NO_COUNT).headcount;
        if (headcount > capacity) {
          return {
            error: `${headcount} people have already signed up, so capacity can't be lower than that.`,
          };
        }
      }

      const applyFuture = formData.get("applyFuture") === "on" && existing.seriesId !== null;

      await prisma.$transaction(async (tx) => {
        await tx.run.update({
          where: { id },
          data: { ...template, startsAt, edited: !applyFuture },
        });

        if (applyFuture && existing.seriesId) {
          await tx.runSeries.update({ where: { id: existing.seriesId }, data: template });
          await tx.run.updateMany({
            where: {
              seriesId: existing.seriesId,
              startsAt: { gt: existing.startsAt },
              edited: false,
              status: "SCHEDULED",
            },
            data: template,
          });
        }
      });

      await logAudit({
        actorId: adminId,
        action: "run.update",
        targetType: "run",
        targetId: id,
        details: {
          summary: `Edited run “${input.title}”${applyFuture ? " and all future runs in its series" : ""}`,
        },
      });
    }
  } catch (error) {
    console.error("saveRun failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  refresh(savedId);
  redirect(id ? `${LIST_PATH}/${id}` : LIST_PATH);
}

export async function setRunCancelled(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cancel = formData.get("cancel") === "1";

  const run = await prisma.run.update({
    where: { id },
    data: { status: cancel ? "CANCELLED" : "SCHEDULED" },
  });

  await logAudit({
    actorId: userId,
    action: cancel ? "run.cancel" : "run.reinstate",
    targetType: "run",
    targetId: id,
    details: { summary: `${cancel ? "Cancelled" : "Reinstated"} run “${run.title}”` },
  });
  refresh(id);
}

// Stops a repeating run: no more dates are created and all future ones are cancelled.
export async function endSeries(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const seriesId = String(formData.get("seriesId") ?? "");
  const now = new Date();

  const series = await prisma.runSeries.findUnique({ where: { id: seriesId } });
  if (!series) return;

  const [, cancelled] = await prisma.$transaction([
    prisma.runSeries.update({ where: { id: seriesId }, data: { endsOn: now } }),
    prisma.run.updateMany({
      where: { seriesId, startsAt: { gt: now }, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    }),
  ]);

  await logAudit({
    actorId: userId,
    action: "run.end_series",
    targetType: "run_series",
    targetId: seriesId,
    details: {
      summary: `Ended repeating run “${series.title}” and cancelled ${cancelled.count} future run(s)`,
    },
  });
  refresh();
}
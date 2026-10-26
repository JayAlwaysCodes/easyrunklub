"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export type RsvpActionState = { error?: string; success?: string };

class RsvpError extends Error {}

// Active members (and admins) may RSVP.
async function eligibleUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, membership: { select: { status: true } } },
  });
  if (!user) return null;

  const isStaff = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  return isStaff || user.membership?.status === "ACTIVE" ? session.user.id : null;
}

function refresh(runId: string) {
  revalidatePath("/dashboard/runs");
  revalidatePath("/admin/dashboard/runs");
  revalidatePath(`/admin/dashboard/runs/${runId}`);
}

export async function rsvpToRun(
  _prev: RsvpActionState,
  formData: FormData
): Promise<RsvpActionState> {
  const userId = await eligibleUserId();
  if (!userId) return { error: "Only active members can RSVP." };

  const runId = String(formData.get("runId") ?? "");
  const guests = Number(formData.get("guests") ?? "0");
  if (!runId) return { error: "Run not found." };
  if (!Number.isInteger(guests) || guests < 0 || guests > 5) {
    return { error: "Choose a valid number of guests." };
  }

  let existed = false;

  try {
    await prisma.$transaction(async (tx) => {
      // Lock this run's row so two people can't grab the last spot at once.
      await tx.$queryRaw`SELECT id FROM runs WHERE id = ${runId} FOR UPDATE`;

      const run = await tx.run.findUnique({ where: { id: runId } });
      if (!run || run.status !== "SCHEDULED") throw new RsvpError("This run isn't available.");
      if (run.startsAt <= new Date()) throw new RsvpError("This run has already started.");

      if (guests > 0 && !run.guestsAllowed) {
        throw new RsvpError("Guests aren't allowed on this run.");
      }
      if (guests > run.maxGuestsPerMember) {
        throw new RsvpError(
          `You can bring up to ${run.maxGuestsPerMember} guest${run.maxGuestsPerMember === 1 ? "" : "s"}.`
        );
      }

      if (run.capacity !== null) {
        const others = await tx.runRsvp.aggregate({
          where: { runId, userId: { not: userId } },
          _count: { _all: true },
          _sum: { guests: true },
        });
        const taken = others._count._all + (others._sum.guests ?? 0);
        const left = run.capacity - taken;

        if (left < 1 + guests) {
          throw new RsvpError(
            left <= 0
              ? "Sorry, this run is full."
              : `Only ${left} spot${left === 1 ? "" : "s"} left. Try bringing fewer guests.`
          );
        }
      }

      const current = await tx.runRsvp.findUnique({
        where: { runId_userId: { runId, userId } },
      });
      existed = current !== null;

      await tx.runRsvp.upsert({
        where: { runId_userId: { runId, userId } },
        create: { runId, userId, guests },
        update: { guests },
      });
    });
  } catch (error) {
    if (error instanceof RsvpError) return { error: error.message };
    console.error("rsvpToRun failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  refresh(runId);
  return { success: existed ? "Your RSVP is updated." : "You're in! See you there." };
}

export async function cancelRsvp(
  _prev: RsvpActionState,
  formData: FormData
): Promise<RsvpActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const runId = String(formData.get("runId") ?? "");

  // Can't cancel once the run has started or you've been checked in.
  const result = await prisma.runRsvp.deleteMany({
    where: {
      runId,
      userId: session.user.id,
      checkedInAt: null,
      run: { startsAt: { gt: new Date() } },
    },
  });
  if (result.count === 0) return { error: "This RSVP can't be cancelled any more." };

  refresh(runId);
  return { success: "RSVP cancelled." };
}
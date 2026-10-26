"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";

export type CheckInResult = {
  status: "ok" | "already" | "error";
  message: string;
  name?: string;
  membershipNumber?: string;
  guests?: number;
  walkIn?: boolean;
  time?: string;
  checkedIn?: number;
  rsvps?: number;
};

const HOUR_MS = 60 * 60 * 1000;
const OPENS_BEFORE_MS = 2 * HOUR_MS;
const CLOSES_AFTER_MS = 6 * HOUR_MS;

const STATUS_TEXT: Record<string, string> = {
  PENDING: "not activated yet",
  LAPSED: "lapsed (dues unpaid)",
  INACTIVE: "inactive",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

function timeLabel(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
}

async function getCounts(runId: string) {
  const [checkedIn, rsvps] = await Promise.all([
    prisma.runRsvp.count({ where: { runId, checkedInAt: { not: null } } }),
    prisma.runRsvp.count({ where: { runId } }),
  ]);
  return { checkedIn, rsvps };
}

export async function checkInMember(runId: string, rawCode: string): Promise<CheckInResult> {
  try {
    await requireAdmin();
  } catch {
    return { status: "error", message: "You don't have permission to check people in." };
  }

  const code = rawCode.trim().toUpperCase();
  if (!/^ERK-\d{3,8}$/.test(code)) {
    return { status: "error", message: "That isn't an Easy Run Klub membership QR code or ID." };
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run || run.status !== "SCHEDULED") {
    return { status: "error", message: "This run is cancelled or doesn't exist." };
  }

  const now = Date.now();
  const opensAt = run.startsAt.getTime() - OPENS_BEFORE_MS;
  const closesAt = run.startsAt.getTime() + CLOSES_AFTER_MS;
  if (now < opensAt) {
    return {
      status: "error",
      message: `Check-in opens at ${timeLabel(new Date(opensAt))}, two hours before the run.`,
    };
  }
  if (now > closesAt) {
    return { status: "error", message: "Check-in for this run has closed." };
  }

  const membership = await prisma.membership.findUnique({
    where: { membershipNumber: code },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!membership) {
    return { status: "error", message: `No member found with ID ${code}.` };
  }

  const userId = membership.user.id;
  const name = membership.user.name ?? membership.user.email;
  const base = { name, membershipNumber: code };

  if (membership.status !== "ACTIVE") {
    return {
      ...base,
      status: "error",
      message: `${name}'s membership is ${STATUS_TEXT[membership.status] ?? membership.status.toLowerCase()}, so they can't check in yet.`,
    };
  }

  // Claim the check-in atomically so two scanners can't both count it.
  const checkedInAt = new Date();
  const claimed = await prisma.runRsvp.updateMany({
    where: { runId, userId, checkedInAt: null },
    data: { checkedInAt },
  });

  let walkIn = false;
  let guests = 0;

  if (claimed.count === 1) {
    const rsvp = await prisma.runRsvp.findUnique({
      where: { runId_userId: { runId, userId } },
      select: { guests: true },
    });
    guests = rsvp?.guests ?? 0;
  } else {
    const existing = await prisma.runRsvp.findUnique({
      where: { runId_userId: { runId, userId } },
    });

    if (existing?.checkedInAt) {
      return {
        ...base,
        status: "already",
        message: `${name} was already checked in at ${timeLabel(existing.checkedInAt)}.`,
        guests: existing.guests,
        time: timeLabel(existing.checkedInAt),
        ...(await getCounts(runId)),
      };
    }

    // No RSVP: treat as a walk-in.
    try {
      await prisma.runRsvp.create({
        data: { runId, userId, guests: 0, checkedInAt },
      });
      walkIn = true;
    } catch {
      return { ...base, status: "already", message: `${name} was just checked in.` };
    }
  }

  revalidatePath(`/admin/dashboard/runs/${runId}`);

  return {
    ...base,
    status: "ok",
    message: walkIn
      ? `${name} is checked in (walk-in, no RSVP).`
      : `${name} is checked in.`,
    guests,
    walkIn,
    time: timeLabel(checkedInAt),
    ...(await getCounts(runId)),
  };
}
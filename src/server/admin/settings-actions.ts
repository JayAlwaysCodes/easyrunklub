"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { getClubSettings, SETTING_KEYS } from "@/server/settings";
import { clubSettingsSchema } from "@/validators/settings";

export type SettingsActionState = { error?: string; success?: string };

function toNumber(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : Number.NaN;
}

export async function updateClubSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  let adminId: string;
  try {
    adminId = (await requireSuperAdmin()).userId;
  } catch {
    return { error: "You don't have permission to do this." };
  }

  const raw = {
    activationFeeNaira: toNumber(formData.get("activationFeeNaira")),
    monthlyDuesNaira: toNumber(formData.get("monthlyDuesNaira")),
    duesGraceDays: toNumber(formData.get("duesGraceDays")),
  };
  if (Object.values(raw).some((value) => !Number.isFinite(value))) {
    return { error: "Please fill in every field with a number." };
  }

  const parsed = clubSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the values." };
  }

  const next = {
    activationFeeKobo: parsed.data.activationFeeNaira * 100,
    monthlyDuesKobo: parsed.data.monthlyDuesNaira * 100,
    duesGraceDays: parsed.data.duesGraceDays,
  };
  const current = await getClubSettings();

  // Only record what actually changed.
  const changes: { label: string; kind: "money" | "days"; from: number; to: number }[] = [];
  if (next.activationFeeKobo !== current.activationFeeKobo) {
    changes.push({ label: "Activation fee", kind: "money", from: current.activationFeeKobo, to: next.activationFeeKobo });
  }
  if (next.monthlyDuesKobo !== current.monthlyDuesKobo) {
    changes.push({ label: "Monthly dues", kind: "money", from: current.monthlyDuesKobo, to: next.monthlyDuesKobo });
  }
  if (next.duesGraceDays !== current.duesGraceDays) {
    changes.push({ label: "Grace period", kind: "days", from: current.duesGraceDays, to: next.duesGraceDays });
  }
  if (changes.length === 0) {
    return { error: "Nothing has changed." };
  }

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.activationFeeKobo },
      update: { value: String(next.activationFeeKobo) },
      create: { key: SETTING_KEYS.activationFeeKobo, value: String(next.activationFeeKobo) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.monthlyDuesKobo },
      update: { value: String(next.monthlyDuesKobo) },
      create: { key: SETTING_KEYS.monthlyDuesKobo, value: String(next.monthlyDuesKobo) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.duesGraceDays },
      update: { value: String(next.duesGraceDays) },
      create: { key: SETTING_KEYS.duesGraceDays, value: String(next.duesGraceDays) },
    }),
  ]);

  await logAudit({
    actorId: adminId,
    action: "settings.update",
    targetType: "settings",
    details: { changes },
  });

  revalidatePath("/admin/dashboard/settings");
  return { success: "Settings saved." };
}
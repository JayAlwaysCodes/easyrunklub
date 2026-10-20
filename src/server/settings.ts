import { prisma } from "@/server/db/prisma";

export const SETTING_KEYS = {
  activationFeeKobo: "activation_fee_kobo",
  monthlyDuesKobo: "monthly_dues_kobo",
  duesGraceDays: "dues_grace_days",
} as const;

// Used only if a row is missing from the database.
const FALLBACKS = {
  activationFeeKobo: 2_000_000, // ₦20,000
  monthlyDuesKobo: 1_000_000, // ₦10,000
  duesGraceDays: 7,
};

export type ClubSettings = typeof FALLBACKS;

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function getClubSettings(): Promise<ClubSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    activationFeeKobo: toInt(
      map.get(SETTING_KEYS.activationFeeKobo),
      FALLBACKS.activationFeeKobo
    ),
    monthlyDuesKobo: toInt(
      map.get(SETTING_KEYS.monthlyDuesKobo),
      FALLBACKS.monthlyDuesKobo
    ),
    duesGraceDays: toInt(
      map.get(SETTING_KEYS.duesGraceDays),
      FALLBACKS.duesGraceDays
    ),
  };
}
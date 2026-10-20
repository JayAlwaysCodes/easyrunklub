import type { Prisma } from "@prisma/client";

const COUNTER_KEY = "membership_counter";

/**
 * Returns the next membership number, e.g. "ERK-000007".
 * The increment is a single atomic SQL statement, so two people
 * registering at the same moment can never get the same number.
 * Call it with the transaction client so a failed registration
 * doesn't leave a gap.
 */
export async function nextMembershipNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO "settings" ("key", "value", "updatedAt")
    VALUES (${COUNTER_KEY}, '1', NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "value" = (("settings"."value")::int + 1)::text,
                  "updatedAt" = NOW()
    RETURNING "value"
  `;

  const n = Number.parseInt(rows[0].value, 10);
  return `ERK-${String(n).padStart(6, "0")}`;
}
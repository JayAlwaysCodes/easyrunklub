"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { syncAllMemberDues } from "@/server/dues/sync-all";
import type { AdminActionState } from "@/server/admin/member-actions";

export async function refreshAllDues(
  _prev: AdminActionState
): Promise<AdminActionState> {
  let adminId: string;
  try {
    adminId = (await requireAdmin()).userId;
  } catch {
    return { error: "You don't have permission to do this." };
  }

  const { checked, failed } = await syncAllMemberDues();

  await logAudit({
    actorId: adminId,
    action: "dues.refresh_all",
    details: {
      summary: `Refreshed dues for ${checked} member(s)${failed ? `, ${failed} failed` : ""}`,
    },
  });

  revalidatePath("/admin/dashboard/dues");
  return {
    success: `Checked ${checked} member(s)${failed ? `. ${failed} failed, see the terminal.` : ". Everything is up to date."}`,
  };
}
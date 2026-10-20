"use server";

import { auth } from "@/server/auth";
import { issueVerificationEmail } from "@/server/auth/verification-token";

export async function sendVerificationEmail() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  await issueVerificationEmail(session.user.email);
  return { sent: true };
}
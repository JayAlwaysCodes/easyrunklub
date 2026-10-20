import { randomBytes } from "crypto";

import { prisma } from "@/server/db/prisma";

const TOKEN_EXPIRY_HOURS = 24;

// Creates a fresh verification link for an email address and "sends" it.
// Any older unused links for that address are removed first.
export async function issueVerificationEmail(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  // No email service is wired up yet. When a provider (e.g. Resend) is
  // chosen, this console.log becomes a real send.
  console.log("=== EMAIL VERIFICATION LINK (placeholder) ===");
  console.log(`To: ${email}`);
  console.log(`Link: ${verificationUrl}`);
  console.log("==============================================");

  return { url: verificationUrl };
}
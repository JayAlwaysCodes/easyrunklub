"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { initializeTransaction } from "@/server/payments/paystack";
import type { DuesActionState } from "@/server/dues/actions";

export async function startDuesCheckout(
  _prev: DuesActionState,
  formData: FormData
): Promise<DuesActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Please log in again." };
  const userId = session.user.id;

  const chargeId = String(formData.get("chargeId") ?? "");
  const charge = await prisma.duesCharge.findFirst({
    where: { id: chargeId, userId },
  });
  if (!charge || charge.status !== "DUE") {
    return { error: "This payment is no longer due." };
  }

  const older = await prisma.duesCharge.count({
    where: { userId, status: "DUE", periodStart: { lt: charge.periodStart } },
  });
  if (older > 0) {
    return { error: "Please pay your oldest unpaid month first." };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { error: "No wallet found for this account." };

  const monthLabel = charge.periodStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const reference = `ERK-DUE-${randomUUID()}`;

  // The charge id travels in the transaction's metadata, so the callback
  // and webhook know which month this payment is for.
  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "PAYMENT",
      status: "PENDING",
      purpose: "DUES",
      amount: charge.amount,
      currency: "NGN",
      provider: "paystack",
      providerReference: reference,
      metadata: { duesChargeId: charge.id },
      description: `Monthly dues – ${monthLabel}`,
    },
  });

  let authorizationUrl: string;
  try {
    const result = await initializeTransaction({
      email: session.user.email!,
      amountKobo: charge.amount,
      reference,
      callbackUrl: `${process.env.NEXTAUTH_URL}/dashboard/dues/callback`,
    });
    authorizationUrl = result.authorization_url;
  } catch {
    await prisma.transaction.deleteMany({
      where: { providerReference: reference, status: "PENDING" },
    });
    return { error: "Couldn't start the payment. Please try again." };
  }

  // redirect() must be outside the try/catch (it works by throwing).
  redirect(authorizationUrl);
}
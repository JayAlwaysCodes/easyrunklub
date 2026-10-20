"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { initializeTransaction } from "@/server/payments/paystack";
import { getClubSettings } from "@/server/settings";
import { MAX_TOPUP_NAIRA, MIN_TOPUP_NAIRA } from "@/lib/config/payments";

export type PaymentActionState = { error?: string };

export async function startActivationCheckout() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  });
  if (!wallet) {
    throw new Error("No wallet found for this user");
  }

  // The fee comes from the admin-editable settings table.
  const { activationFeeKobo } = await getClubSettings();

  const reference = `ERK-ACT-${randomUUID()}`;

  // Record the attempt as PENDING before sending the user to Paystack, so
  // we have a row to update once payment is verified, and so we can spot
  // abandoned attempts later if the user never completes checkout.
  // The amount is frozen on this row, so if admin changes the fee while
  // someone is mid-checkout, they are still judged against what they saw.
  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "PAYMENT",
      status: "PENDING",
      purpose: "ACTIVATION",
      amount: activationFeeKobo,
      currency: "NGN",
      provider: "paystack",
      providerReference: reference,
      description: "Membership activation fee",
    },
  });

  const { authorization_url } = await initializeTransaction({
    email: session.user.email!,
    amountKobo: activationFeeKobo,
    reference,
    callbackUrl: `${process.env.NEXTAUTH_URL}/activate/callback`,
  });

  redirect(authorization_url);
}

// Wallet top-up. Used with useActionState, so it can return an error
// message; on success it redirects to Paystack and never returns.
export async function startTopUpCheckout(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Please log in again." };
  }

  const naira = Number(formData.get("amount"));
  if (!Number.isInteger(naira)) {
    return { error: "Enter a whole-naira amount, e.g. 5000." };
  }
  if (naira < MIN_TOPUP_NAIRA || naira > MAX_TOPUP_NAIRA) {
    return {
      error: `Amount must be between ₦${MIN_TOPUP_NAIRA.toLocaleString()} and ₦${MAX_TOPUP_NAIRA.toLocaleString()}.`,
    };
  }
  const amountKobo = naira * 100;

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  });
  if (!wallet) {
    return { error: "No wallet found for this account." };
  }

  const reference = `ERK-TOP-${randomUUID()}`;

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "DEPOSIT",
      status: "PENDING",
      purpose: "TOPUP",
      amount: amountKobo,
      currency: "NGN",
      provider: "paystack",
      providerReference: reference,
      description: "Wallet top-up",
    },
  });

  let authorizationUrl: string;
  try {
    const result = await initializeTransaction({
      email: session.user.email!,
      amountKobo,
      reference,
      callbackUrl: `${process.env.NEXTAUTH_URL}/dashboard/wallet/callback`,
    });
    authorizationUrl = result.authorization_url;
  } catch {
    // Couldn't reach Paystack: don't leave a stray pending row behind.
    await prisma.transaction.deleteMany({
      where: { providerReference: reference, status: "PENDING" },
    });
    return { error: "Couldn't start the payment. Please try again." };
  }

  // redirect() must be outside the try/catch (it works by throwing).
  redirect(authorizationUrl);
}
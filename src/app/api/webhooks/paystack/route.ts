import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { processPayment } from "@/server/payments/process-payment";

function isValidSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      // Routes to the activation or top-up handler based on the
      // transaction's purpose.
      const routed = await processPayment(event.data.reference);
      console.log("Paystack webhook processed:", event.data.reference, routed);
    } catch (error) {
      console.error("Paystack webhook processing failed:", error);
      // A 500 tells Paystack to retry later.
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  // Always acknowledge events we don't act on, so Paystack doesn't retry them.
  return NextResponse.json({ received: true });
}
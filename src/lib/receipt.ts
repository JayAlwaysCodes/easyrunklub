// Pure helpers for receipts (no database access, so they are easy to test).

export function formatReceiptNumber(n: number) {
  return `RCP-${String(n).padStart(6, "0")}`;
}

const PURPOSE_LABELS: Record<string, string> = {
  ACTIVATION: "Membership activation fee",
  DUES: "Monthly dues",
  TOPUP: "Wallet top-up",
  OTHER: "Payment",
};

// A missing purpose means an older payment from before purposes existed,
// which were always activation fees.
export function receiptPurposeLabel(purpose: string | null | undefined) {
  if (!purpose) return PURPOSE_LABELS.ACTIVATION;
  return PURPOSE_LABELS[purpose] ?? PURPOSE_LABELS.OTHER;
}

export function paymentMethodLabel(
  provider: string | null | undefined,
  metadata: unknown
): string {
  const name = (provider ?? "").toLowerCase();

  if (name === "paystack") return "Card / bank (Paystack)";
  if (name === "wallet") return "Wallet balance";

  if (name === "manual") {
    const method =
      metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>).method
        : undefined;
    if (method === "cash") return "Cash";
    if (method === "transfer") return "Bank transfer";
    return "Recorded by an admin";
  }

  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "—";
}
import { describe, expect, it } from "vitest";

import { formatReceiptNumber, paymentMethodLabel, receiptPurposeLabel } from "./receipt";

describe("formatReceiptNumber", () => {
  it("pads to six digits", () => {
    expect(formatReceiptNumber(1)).toBe("RCP-000001");
    expect(formatReceiptNumber(123)).toBe("RCP-000123");
  });

  it("keeps growing past six digits instead of cutting off", () => {
    expect(formatReceiptNumber(1234567)).toBe("RCP-1234567");
  });
});

describe("receiptPurposeLabel", () => {
  it("labels each purpose", () => {
    expect(receiptPurposeLabel("ACTIVATION")).toBe("Membership activation fee");
    expect(receiptPurposeLabel("DUES")).toBe("Monthly dues");
    expect(receiptPurposeLabel("TOPUP")).toBe("Wallet top-up");
    expect(receiptPurposeLabel("OTHER")).toBe("Payment");
  });

  it("treats a missing purpose (older rows) as an activation fee", () => {
    expect(receiptPurposeLabel(null)).toBe("Membership activation fee");
    expect(receiptPurposeLabel(undefined)).toBe("Membership activation fee");
  });

  it("falls back to a generic label for unknown purposes", () => {
    expect(receiptPurposeLabel("SOMETHING_NEW")).toBe("Payment");
  });
});

describe("paymentMethodLabel", () => {
  it("recognises Paystack and wallet payments", () => {
    expect(paymentMethodLabel("paystack", null)).toBe("Card / bank (Paystack)");
    expect(paymentMethodLabel("Paystack", {})).toBe("Card / bank (Paystack)");
    expect(paymentMethodLabel("wallet", null)).toBe("Wallet balance");
  });

  it("reads the method of payments recorded by an admin", () => {
    expect(paymentMethodLabel("manual", { method: "cash" })).toBe("Cash");
    expect(paymentMethodLabel("manual", { method: "transfer" })).toBe("Bank transfer");
    expect(paymentMethodLabel("manual", { note: "x" })).toBe("Recorded by an admin");
    expect(paymentMethodLabel("manual", null)).toBe("Recorded by an admin");
    expect(paymentMethodLabel("manual", ["cash"])).toBe("Recorded by an admin");
  });

  it("handles missing or unknown providers", () => {
    expect(paymentMethodLabel(null, null)).toBe("—");
    expect(paymentMethodLabel(undefined, null)).toBe("—");
    expect(paymentMethodLabel("flutterwave", null)).toBe("Flutterwave");
  });
});
import { z } from "zod";

const method = z.enum(["cash", "transfer"], {
  message: "Choose how the payment was made",
});

const reason = z
  .string()
  .trim()
  .min(3, "Please give a short reason (at least 3 characters)")
  .max(200, "Keep the reason under 200 characters");

const note = z.string().trim().max(200, "Keep the note under 200 characters");

export const manualActivationSchema = z.object({
  userId: z.string().min(1),
  method,
  note,
});

export const statusChangeSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"], {
    message: "Choose a status",
  }),
  reason,
});

export const markPaidSchema = z.object({
  chargeId: z.string().min(1),
  method,
  note,
});

export const waiveSchema = z.object({
  chargeId: z.string().min(1),
  reason,
});
import { z } from "zod";

export const clubSettingsSchema = z.object({
  activationFeeNaira: z
    .number()
    .int("The activation fee must be a whole number of naira")
    .min(100, "The activation fee must be at least ₦100")
    .max(1_000_000, "The activation fee can't be more than ₦1,000,000"),
  monthlyDuesNaira: z
    .number()
    .int("Monthly dues must be a whole number of naira")
    .min(0, "Monthly dues can't be negative")
    .max(500_000, "Monthly dues can't be more than ₦500,000"),
  duesGraceDays: z
    .number()
    .int("Grace days must be a whole number")
    .min(0, "Grace days can't be negative")
    .max(60, "Grace days can't be more than 60"),
});
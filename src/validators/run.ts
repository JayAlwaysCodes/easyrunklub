import { z } from "zod";

export const runSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Keep the title under 120 characters"),
  description: z.string().trim().max(2000, "Keep the description under 2,000 characters"),
  location: z
    .string()
    .trim()
    .min(2, "Where is the run?")
    .max(200, "Keep the location under 200 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  capacity: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 5000),
      "Capacity must be a whole number from 1 to 5000, or blank for no limit"
    ),
  guestsAllowed: z.boolean(),
  maxGuests: z.string().refine((v) => /^[1-5]$/.test(v), "Guests per member must be 1 to 5"),
  repeat: z.enum(["none", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]),
  repeatUntil: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a valid end date"),
});
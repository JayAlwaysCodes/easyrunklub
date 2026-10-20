import { z } from "zod";

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Keep the title under 120 characters"),
  body: z
    .string()
    .trim()
    .min(3, "Write a message (at least 3 characters)")
    .max(5000, "Keep the message under 5,000 characters"),
});
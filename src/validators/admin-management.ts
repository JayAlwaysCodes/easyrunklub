import { z } from "zod";

export const addAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
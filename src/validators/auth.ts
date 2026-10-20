import { z } from "zod";

export const registerSchema = z.object({
  // Step 1 — Account Basics
  firstName: z.string().trim().min(2, "First name is required").max(50),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),

  // Step 2 — Personal Details
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    message: "Please select a gender",
  }),
  address: z.string().trim().min(3, "Address is required").max(200),

  // Step 3 — Emergency Contact
  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Emergency contact name is required")
    .max(80),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),

  // Agreements
  acceptedTerms: z.literal(true, {
    message: "You must accept the Terms and Conditions",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
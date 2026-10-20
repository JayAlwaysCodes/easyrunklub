import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\s()-]{7,20}$/, "Enter a valid phone number");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone,
  dateOfBirth: z
    .string()
    .min(1, "Enter your date of birth")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date of birth",
    })
    .refine((value) => new Date(value) <= new Date(), {
      message: "Date of birth can't be in the future",
    })
    .refine((value) => new Date(value).getFullYear() >= 1900, {
      message: "Enter a valid date of birth",
    }),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    message: "Select your gender",
  }),
  address: z.string().trim().min(3, "Enter your address or city").max(200),
  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Enter your emergency contact's name")
    .max(80),
  emergencyContactPhone: phone,
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The new passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Your new password must be different from the current one",
    path: ["newPassword"],
  });
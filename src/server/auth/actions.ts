"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/server/auth";
import { loginSchema, registerSchema } from "@/validators/auth";
import { registerUser, EmailInUseError } from "@/server/auth/register-user";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    // NEXT_REDIRECT is thrown by Auth.js/Next.js on a *successful* sign-in
    // to perform the redirect; it must be re-thrown, not treated as a
    // login failure.
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest?: unknown }).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }

    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }

    return { error: "Something went wrong. Please try again." };
  }
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors
    ).flat()[0];
    return { error: firstError ?? "Please check your details and try again" };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return { error: error.message };
    }
    console.error("Registration failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  // Auto sign-in immediately after successful registration.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest?: unknown }).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    return { error: "Account created. Please log in." };
  }
}
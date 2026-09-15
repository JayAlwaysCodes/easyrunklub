import { NextResponse } from "next/server";

import { registerSchema } from "@/validators/auth";
import { registerUser, EmailInUseError } from "@/server/auth/register-user";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const user = await registerUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
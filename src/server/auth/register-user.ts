import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import type { RegisterInput } from "@/validators/auth";

export class EmailInUseError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailInUseError";
  }
}

export async function registerUser({ name, email, password }: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new EmailInUseError();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "MEMBER",
      membership: {
        create: {
          status: "PENDING",
          plan: "standard",
        },
      },
      wallet: {
        create: {
          balance: 0,
          currency: "NGN",
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}
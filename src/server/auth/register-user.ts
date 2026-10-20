import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import { nextMembershipNumber } from "@/server/membership/number";
import type { RegisterInput } from "@/validators/auth";

export class EmailInUseError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailInUseError";
  }
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new EmailInUseError();
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Number and user are created in one transaction, so a failed
  // registration never burns a membership number.
  return prisma.$transaction(async (tx) => {
    const membershipNumber = await nextMembershipNumber(tx);

    return tx.user.create({
      data: {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "MEMBER",
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        address: input.address,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        membership: {
          create: {
            membershipNumber,
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
  });
}
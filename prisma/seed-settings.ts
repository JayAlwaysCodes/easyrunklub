import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = [
  { key: "activation_fee_kobo", value: "2000000" }, // ₦20,000
  { key: "monthly_dues_kobo", value: "1000000" }, // ₦10,000
  { key: "dues_grace_days", value: "7" },
];

async function main() {
  // Defaults only: `update: {}` means admin edits are never overwritten.
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Give every existing membership a number (oldest first).
  const total = await prisma.membership.count({
    where: { membershipNumber: { not: null } },
  });
  const missing = await prisma.membership.findMany({
    where: { membershipNumber: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  let next = total + 1;
  for (const membership of missing) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { membershipNumber: `ERK-${String(next).padStart(6, "0")}` },
    });
    next += 1;
  }

  console.log(`Settings ready. Numbered ${missing.length} membership(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
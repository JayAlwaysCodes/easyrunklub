import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { logAudit } from "@/server/audit";
import { toCsv } from "@/lib/csv";
import { lagosDateString, resolveRange } from "@/server/reports/range";

export const dynamic = "force-dynamic";

const naira = (kobo: number) => (kobo / 100).toFixed(2);
const lagosDateTime = (date: Date) =>
  date.toLocaleString("sv-SE", { timeZone: "Africa/Lagos" });

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  let adminId: string;
  try {
    adminId = (await requireAdmin()).userId;
  } catch {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const { type } = await params;
  const url = new URL(request.url);
  const today = lagosDateString(new Date());

  if (type === "members") {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        emailVerified: true,
        createdAt: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        membership: { select: { membershipNumber: true, status: true, startDate: true } },
        wallet: { select: { balance: true } },
      },
    });

    const rows = [
      [
        "Membership ID", "Name", "Email", "Email verified", "Phone", "Gender",
        "Date of birth", "Address", "Status", "Active since", "Joined",
        "Wallet balance (NGN)", "Emergency contact", "Emergency phone",
      ],
      ...members.map((m) => [
        m.membership?.membershipNumber ?? "",
        m.name ?? "",
        m.email,
        m.emailVerified ? "Yes" : "No",
        m.phone ?? "",
        m.gender ?? "",
        m.dateOfBirth ? lagosDateString(m.dateOfBirth) : "",
        m.address ?? "",
        m.membership?.status ?? "",
        m.membership?.startDate ? lagosDateString(m.membership.startDate) : "",
        lagosDateString(m.createdAt),
        naira(m.wallet?.balance ?? 0),
        m.emergencyContactName ?? "",
        m.emergencyContactPhone ?? "",
      ]),
    ];

    await logAudit({
      actorId: adminId,
      action: "report.export_members",
      details: { summary: `Exported ${members.length} member(s) to CSV` },
    });
    return csvResponse(toCsv(rows), `easyrunklub-members-${today}.csv`);
  }

  if (type === "payments") {
    const { fromStr, toStr, start, end } = resolveRange(
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined
    );

    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                membership: { select: { membershipNumber: true } },
              },
            },
          },
        },
      },
    });

    const rows = [
      [
        "Date (Lagos)", "Membership ID", "Name", "Email", "Type", "Description",
        "Provider", "Reference", "Status", "Amount (NGN)",
      ],
      ...transactions.map((t) => [
        lagosDateTime(t.createdAt),
        t.wallet.user.membership?.membershipNumber ?? "",
        t.wallet.user.name ?? "",
        t.wallet.user.email,
        t.purpose ?? t.type,
        t.description ?? "",
        t.provider ?? "",
        t.providerReference ?? "",
        t.status,
        naira(t.amount),
      ]),
    ];

    await logAudit({
      actorId: adminId,
      action: "report.export_payments",
      details: {
        summary: `Exported ${transactions.length} payment(s) to CSV (${fromStr} to ${toStr})`,
      },
    });
    return csvResponse(toCsv(rows), `easyrunklub-payments-${fromStr}-to-${toStr}.csv`);
  }

  return new NextResponse("Unknown export", { status: 404 });
}
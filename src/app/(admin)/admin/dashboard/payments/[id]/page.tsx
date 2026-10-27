import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentControls } from "@/components/admin/payment-controls";
import { formatDateTime, formatNaira } from "@/lib/format";

export const metadata = { title: "Payment | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<string, string> = {
  ACTIVATION: "Activation fee",
  TOPUP: "Wallet top-up",
  DUES: "Monthly dues",
  OTHER: "Other",
};

const STATUS_CLASSES: Record<string, string> = {
  COMPLETED: "bg-brand-mint text-brand-forest",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right font-medium">{children}</span>
    </div>
  );
}

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      wallet: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              membership: { select: { membershipNumber: true } },
            },
          },
        },
      },
    },
  });
  if (!tx) notFound();

  const user = tx.wallet.user;
  const meta =
    tx.metadata && typeof tx.metadata === "object" && !Array.isArray(tx.metadata)
      ? (tx.metadata as Record<string, unknown>)
      : {};
  const canResolve = tx.status === "PENDING" && tx.provider === "paystack";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/dashboard/payments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All payments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {formatNaira(tx.amount)}
          </h1>
          <p className="text-muted-foreground">
            {tx.purpose ? PURPOSE_LABELS[tx.purpose] : tx.type}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_CLASSES[tx.status] ?? "bg-muted text-foreground"
          }`}
        >
          {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
        </span>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Member">
            <Link href={`/admin/dashboard/members/${user.id}`} className="hover:text-brand-green">
              {user.name ?? user.email}
            </Link>
          </Row>
          <Row label="Membership ID">{user.membership?.membershipNumber ?? "—"}</Row>
          <Row label="Date">{formatDateTime(tx.createdAt)}</Row>
          <Row label="Description">{tx.description ?? "—"}</Row>
          <Row label="Provider">{tx.provider ?? "—"}</Row>
          <Row label="Reference">{tx.providerReference ?? "—"}</Row>
          {typeof meta.method === "string" && (
            <Row label="Recorded by an admin">
              {meta.method}
              {typeof meta.note === "string" && meta.note ? ` · ${meta.note}` : ""}
            </Row>
          )}
          {typeof meta.rejectReason === "string" && (
            <Row label="Rejected because">{meta.rejectReason}</Row>
          )}
        </CardContent>
      </Card>

      {canResolve && (
        <Card className="rounded-2xl border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This payment is still waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentControls transactionId={tx.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
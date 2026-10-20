import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MailWarning } from "lucide-react";

import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import { syncMembershipDues } from "@/server/dues/sync";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  DuesChargeActions,
  ManualActivationForm,
  StatusChangeForm,
} from "@/components/admin/member-actions";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { statusBadgeClass, statusLabel } from "@/lib/membership-status";
import { ResendVerificationButton } from "@/components/admin/resend-verification-button";

export const metadata = { title: "Member | Easy Run Klub Admin" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

const ACTION_LABELS: Record<string, string> = {
  "member.activate_manual": "Activated manually",
  "member.status_change": "Status changed",
  "dues.mark_paid": "Dues marked paid",
  "dues.waive": "Dues waived",
};

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Bring this member's dues and status up to date before showing them.
  await syncMembershipDues(id);

  const [member, settings, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        membership: true,
        wallet: {
          include: {
            transactions: { orderBy: { createdAt: "desc" }, take: 10 },
          },
        },
        duesCharges: { orderBy: { periodStart: "desc" }, take: 12 },
      },
    }),
    getClubSettings(),
    prisma.auditLog.findMany({
      where: { targetType: "member", targetId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);
  if (!member) notFound();

  const status = member.membership?.status;
  const isMember = member.role === "MEMBER";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/dashboard/members"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All members
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {member.name ?? member.email}
          </h1>
          <p className="text-muted-foreground">
            {member.membership?.membershipNumber ?? "No membership ID"}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(status)}`}
        >
          {statusLabel(status)}
        </span>
      </div>

      {isMember && member.membership && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {status === "PENDING" ? "Activate account" : "Manage status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "PENDING" && (
              <ManualActivationForm
                userId={member.id}
                feeLabel={formatNaira(settings.activationFeeKobo)}
              />
            )}
            <StatusChangeForm userId={member.id} currentStatus={status ?? "PENDING"} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Row label="Email">
              <span className="flex items-center justify-end gap-1.5">
                {member.email}
                {member.emailVerified ? (
                  <BadgeCheck className="h-4 w-4 text-brand-green" aria-label="Verified" />
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-700">
                    <MailWarning className="h-4 w-4" />
                    Not verified
                  </span>
                )}
              </span>
            </Row>
            {!member.emailVerified && isMember && (
              <div className="py-2">
                <ResendVerificationButton userId={member.id} />
              </div>
            )}
            <Row label="Phone">{member.phone ?? "—"}</Row>
            <Row label="Date of birth">
              {member.dateOfBirth ? formatDate(member.dateOfBirth) : "—"}
            </Row>
            <Row label="Gender">
              {member.gender ? GENDER_LABELS[member.gender] : "—"}
            </Row>
            <Row label="Address">{member.address ?? "—"}</Row>
            <Row label="Joined">{formatDate(member.createdAt)}</Row>
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emergency contact
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Row label="Name">{member.emergencyContactName ?? "—"}</Row>
              <Row label="Phone">{member.emergencyContactPhone ?? "—"}</Row>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Row label="Status">{statusLabel(status)}</Row>
              <Row label="Active since">
                {member.membership?.startDate
                  ? formatDate(member.membership.startDate)
                  : "Not activated"}
              </Row>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly dues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {member.duesCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dues charged yet.</p>
          ) : (
            <ul className="divide-y">
              {member.duesCharges.map((charge) => (
                <li key={charge.id} className="space-y-2 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {charge.periodStart.toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                        timeZone: "Africa/Lagos",
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNaira(charge.amount)} ·{" "}
                      {charge.status === "PAID"
                        ? `Paid ${charge.paidAt ? formatDate(charge.paidAt) : ""} (${charge.paidVia ?? "—"})`
                        : charge.status === "WAIVED"
                          ? "Waived"
                          : `Due ${formatDate(charge.dueDate)}`}
                    </span>
                  </div>
                  {charge.status === "DUE" && isMember && (
                    <DuesChargeActions chargeId={charge.id} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>Wallet</span>
            <span className="text-base font-semibold text-foreground">
              {formatNaira(member.wallet?.balance ?? 0)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!member.wallet || member.wallet.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y">
              {member.wallet.transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {transaction.description ?? transaction.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(transaction.createdAt)} · {transaction.status}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatNaira(transaction.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Admin activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin actions recorded for this member.
            </p>
          ) : (
            <ul className="divide-y">
              {activity.map((entry) => {
                const summary = (entry.details as { summary?: string } | null)?.summary;
                return (
                  <li key={entry.id} className="space-y-0.5 py-2.5 text-sm">
                    <p className="font-medium">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </p>
                    {summary && <p className="text-muted-foreground">{summary}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)} ·{" "}
                      {entry.actor?.name ?? entry.actor?.email ?? "Unknown"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import Link from "next/link";
import { ShieldCheck, Wallet as WalletIcon, Mail } from "lucide-react";
import { syncMembershipDues } from "@/server/dues/sync";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ActivationPrompt } from "@/components/dashboard/activation-prompt";
import { MembershipCard } from "@/components/dashboard/membership-card";
import { VerifyEmailButton } from "@/components/dashboard/verify-email-button";
import {
  isEmailVerificationOverdue,
  daysUntilVerificationDeadline,
} from "@/lib/verification-status";

function EmailVerificationCard({ createdAt }: { createdAt: Date }) {
  const overdue = isEmailVerificationOverdue({ createdAt, emailVerified: null });
  const daysLeft = daysUntilVerificationDeadline(createdAt);

  return (
    <Card
      className={`rounded-2xl ${
        overdue ? "border-destructive bg-destructive/5" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="h-4 w-4" />
          Email Verification
        </CardTitle>
        <CardDescription>
          {overdue
            ? "Your account has been flagged for not verifying your email in time."
            : `Verify your email within ${daysLeft} day${daysLeft === 1 ? "" : "s"} to keep your account in good standing.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyEmailButton />
      </CardContent>
    </Card>
  );
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-brand-mint text-brand-forest";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "LAPSED":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  await syncMembershipDues(session.user.id);

  const [membership, wallet, user, settings] = await Promise.all([
    prisma.membership.findUnique({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, emailVerified: true, createdAt: true },
    }),
    getClubSettings(),
  ]);

  const isPending = membership?.status === "PENDING";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome back{(user?.name ?? session.user.name) ? `, ${user?.name ?? session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your Easy Run Klub
          membership.
        </p>
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-forest underline underline-offset-4"
          >
            <ShieldCheck className="h-4 w-4" />
            Go to Admin Panel
          </Link>
        )}
      </div>

      {isPending && <ActivationPrompt feeKobo={settings.activationFeeKobo} />}

      <div className="grid gap-4 md:grid-cols-2">
        <MembershipCard
          name={user?.name ?? session.user.name}
          membershipNumber={membership?.membershipNumber ?? null}
          status={membership?.status}
          memberSince={membership?.startDate ?? null}
        />

        <div className="grid gap-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <WalletIcon className="h-4 w-4" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {wallet ? formatNaira(wallet.balance) : "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Membership Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(
                  membership?.status
                )}`}
              >
                {membership?.status ?? "—"}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {user && !user.emailVerified && (
        <EmailVerificationCard createdAt={user.createdAt} />
      )}
      {user?.emailVerified && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brand-forest">
              Verified on{" "}
              {user.emailVerified.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
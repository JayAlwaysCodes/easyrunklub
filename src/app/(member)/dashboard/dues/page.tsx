import Link from "next/link";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import { syncMembershipDues } from "@/server/dues/sync";
import { nextDueDate } from "@/server/dues/schedule";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { PayDuesButton } from "@/components/dashboard/pay-dues-button";
import { formatDate, formatNaira } from "@/lib/format";

export const metadata = { title: "Monthly Dues | Easy Run Klub" };

const DAY_MS = 24 * 60 * 60 * 1000;

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

export default async function DuesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  await syncMembershipDues(userId);

  const [membership, wallet, settings, charges] = await Promise.all([
    prisma.membership.findUnique({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    getClubSettings(),
    prisma.duesCharge.findMany({
      where: { userId },
      orderBy: { periodStart: "asc" },
    }),
  ]);

  const heading = (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Monthly Dues
      </h1>
      <p className="text-muted-foreground">
        Dues of {formatNaira(settings.monthlyDuesKobo)} a month keep your
        membership in good standing.
      </p>
    </div>
  );

  if (!membership || membership.status === "PENDING" || !membership.startDate) {
    return (
      <div className="space-y-6">
        {heading}
        <Card className="rounded-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Dues start once your account is activated. Activate your account
            from the{" "}
            <Link href="/dashboard" className="underline">
              Overview
            </Link>{" "}
            page.
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const outstanding = charges.filter((charge) => charge.status === "DUE");
  const history = charges
    .filter((charge) => charge.status !== "DUE")
    .sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
  const balance = wallet?.balance ?? 0;
  const next = nextDueDate(membership.startDate, now);

  return (
    <div className="space-y-6">
      {heading}

      {membership.status === "LAPSED" && (
        <p className="rounded-xl bg-orange-100 px-4 py-3 text-sm text-orange-900">
          Your dues are overdue, so some member features are paused. Pay
          your outstanding dues to restore full access.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next dues date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatDate(next)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Grace period: {settings.duesGraceDays} day
              {settings.duesGraceDays === 1 ? "" : "s"} after the due date.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallet balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatNaira(balance)}</p>
            <Link
              href="/dashboard/wallet"
              className="mt-1 inline-block text-sm text-brand-forest underline underline-offset-4"
            >
              Top up wallet
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Outstanding
          </CardTitle>
          {outstanding.length === 0 && (
            <CardDescription>
              You&apos;re all paid up. Thank you!
            </CardDescription>
          )}
        </CardHeader>
        {outstanding.length > 0 && (
          <CardContent>
            <ul className="divide-y">
              {outstanding.map((charge, index) => {
                const graceEnds = new Date(
                  charge.dueDate.getTime() + settings.duesGraceDays * DAY_MS
                );
                const isOverdue = now > graceEnds;
                const canPay = index === 0 && balance >= charge.amount;

                return (
                  <li
                    key={charge.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {monthLabel(charge.periodStart)} —{" "}
                        {formatNaira(charge.amount)}
                      </p>
                      <p
                        className={`text-xs ${
                          isOverdue
                            ? "text-orange-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isOverdue
                          ? `Overdue since ${formatDate(graceEnds)}`
                          : `Due ${formatDate(charge.dueDate)} · pay by ${formatDate(graceEnds)}`}
                      </p>
                      {index === 0 && balance < charge.amount && (
                        <p className="text-xs text-muted-foreground">
                        Your wallet balance is too low. Pay by card, or top up first.
                        </p>
                      )}
                      {index > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Pay the earlier month first.
                        </p>
                      )}
                    </div>
                    {index === 0 && (
                      <PayDuesButton
                        chargeId={charge.id}
                        walletDisabled={!canPay}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Payment history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dues paid yet.
            </p>
          ) : (
            <ul className="divide-y">
              {history.map((charge) => (
                <li
                  key={charge.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span>{monthLabel(charge.periodStart)}</span>
                  <span className="text-muted-foreground">
                    {formatNaira(charge.amount)} ·{" "}
                    {charge.status === "WAIVED"
                      ? "Waived"
                      : `Paid ${charge.paidAt ? formatDate(charge.paidAt) : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { Wallet as WalletIcon } from "lucide-react";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TopUpForm } from "@/components/dashboard/top-up-form";
import { MAX_TOPUP_NAIRA, MIN_TOPUP_NAIRA } from "@/lib/config/payments";
import { formatDateTime, formatNaira } from "@/lib/format";

export const metadata = { title: "Wallet | Easy Run Klub" };

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-brand-mint text-brand-forest",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
  REVERSED: "bg-muted text-muted-foreground",
};

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user) return null;

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!wallet) {
    return <p className="text-muted-foreground">No wallet found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Wallet
        </h1>
        <p className="text-muted-foreground">
          Top up your balance and review your payments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <WalletIcon className="h-4 w-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatNaira(wallet.balance)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your balance for monthly dues and club events.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Up
            </CardTitle>
            <CardDescription>Pay securely with Paystack.</CardDescription>
          </CardHeader>
          <CardContent>
            <TopUpForm minNaira={MIN_TOPUP_NAIRA} maxNaira={MAX_TOPUP_NAIRA} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallet.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y">
              {wallet.transactions.map((transaction) => {
                const isTopUp = transaction.type === "DEPOSIT";
                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {transaction.description ?? transaction.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isTopUp && transaction.status === "COMPLETED"
                            ? "text-brand-green"
                            : ""
                        }`}
                      >
                        {isTopUp ? "+" : transaction.provider === "wallet" ? "−" : ""}
                        {formatNaira(transaction.amount)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          STATUS_STYLES[transaction.status] ?? ""
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
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
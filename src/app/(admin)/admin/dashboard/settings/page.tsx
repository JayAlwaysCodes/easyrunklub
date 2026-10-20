import { prisma } from "@/server/db/prisma";
import { getClubSettings } from "@/server/settings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";
import { formatDateTime, formatNaira } from "@/lib/format";

export const metadata = { title: "Settings | Easy Run Klub Admin" };

type Change = {
  label: string;
  kind: "money" | "days";
  from: number;
  to: number;
};

function formatValue(kind: Change["kind"], value: number) {
  return kind === "money"
    ? formatNaira(value)
    : `${value} day${value === 1 ? "" : "s"}`;
}

export default async function AdminSettingsPage() {
  const [settings, history] = await Promise.all([
    getClubSettings(),
    prisma.auditLog.findMany({
      where: { action: "settings.update" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Fees and dues rules for the whole club.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fees and dues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            defaults={{
              activationFeeNaira: settings.activationFeeKobo / 100,
              monthlyDuesNaira: settings.monthlyDuesKobo / 100,
              duesGraceDays: settings.duesGraceDays,
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent changes
          </CardTitle>
          <CardDescription>Who changed what, and when.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No changes recorded yet.
            </p>
          ) : (
            <ul className="divide-y">
              {history.map((entry) => {
                const changes =
                  (entry.details as { changes?: Change[] } | null)?.changes ??
                  [];
                return (
                  <li key={entry.id} className="space-y-1 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)} ·{" "}
                      {entry.actor?.name ?? entry.actor?.email ?? "Unknown"}
                    </p>
                    {changes.map((change) => (
                      <p key={change.label}>
                        <span className="font-medium">{change.label}:</span>{" "}
                        {formatValue(change.kind, change.from)} →{" "}
                        {formatValue(change.kind, change.to)}
                      </p>
                    ))}
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
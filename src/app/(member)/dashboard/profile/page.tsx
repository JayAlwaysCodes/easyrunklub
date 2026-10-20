import { BadgeCheck, MailWarning } from "lucide-react";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PasswordForm } from "@/components/dashboard/password-form";

export const metadata = { title: "Profile | Easy Run Klub" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { membership: { select: { membershipNumber: true, status: true } } },
  });
  if (!user) return null;

  const showId = user.membership?.status !== "PENDING";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Keep your details up to date so the Klub can reach you.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="flex items-center gap-2 font-medium">
              {user.email}
              {user.emailVerified ? (
                <BadgeCheck
                  className="h-4 w-4 text-brand-green"
                  aria-label="Verified"
                />
              ) : (
                <span className="flex items-center gap-1 text-xs text-yellow-700">
                  <MailWarning className="h-4 w-4" />
                  Not verified
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Membership ID</span>
            <span className="font-medium">
              {showId ? (user.membership?.membershipNumber ?? "—") : "Activate to reveal"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            To change your email address, please contact the Klub.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              name: user.name ?? "",
              phone: user.phone ?? "",
              dateOfBirth: user.dateOfBirth
                ? user.dateOfBirth.toISOString().slice(0, 10)
                : "",
              gender: user.gender ?? "",
              address: user.address ?? "",
              emergencyContactName: user.emergencyContactName ?? "",
              emergencyContactPhone: user.emergencyContactPhone ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Password
          </CardTitle>
          <CardDescription>
            Choose a strong password you don&apos;t use anywhere else.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
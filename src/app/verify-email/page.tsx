import Link from "next/link";

import { prisma } from "@/server/db/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResultCard
        title="Invalid link"
        message="This verification link is missing a token. Please request a new one from your dashboard."
      />
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return (
      <ResultCard
        title="Link not found"
        message="This verification link is invalid or has already been used. Please request a new one from your dashboard."
      />
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return (
      <ResultCard
        title="Link expired"
        message="This verification link has expired. Please request a new one from your dashboard."
      />
    );
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  // Token is single-use — remove it now that it's been consumed.
  await prisma.verificationToken.delete({ where: { token } });

  return (
    <ResultCard
      title="Email verified!"
      message="Your email has been successfully verified."
      success
    />
  );
}

function ResultCard({
  title,
  message,
  success = false,
}: {
  title: string;
  message: string;
  success?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={success ? "text-brand-forest" : ""}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter>
          <Button
            asChild
            className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
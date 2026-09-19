import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/server/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function MemberDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          This is your member dashboard. Real features (runs, streaming,
          payments) land in later modules — for now this confirms your
          account, role, and protected route are all working.
        </p>
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
          >
            <ShieldCheck className="h-4 w-4" />
            Go to Admin Panel
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{session?.user?.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-base">{session?.user?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <CardDescription>Module 1 skeleton</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">Active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
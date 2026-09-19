import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [totalUsers, totalMembers, totalAdmins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin overview
        </h1>
        <p className="text-muted-foreground">
          Platform-wide stats. Real admin tooling (approvals, payments,
          streaming controls) lands in later modules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalAdmins}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
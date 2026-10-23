import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AddAdminForm,
  RemoveAdminButton,
} from "@/components/admin/admin-management-forms";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admins | Easy Run Klub Admin" };
export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await auth();
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Admins</h1>
        <p className="text-muted-foreground">
          Admins can manage members, payments, dues and announcements. Only you, the
          Master Admin, can change settings and fees or manage other admins.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Add an admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AddAdminForm />
          <p className="text-xs text-muted-foreground">
            The person must already have an account with a verified email. After they
            are added they need to sign out and back in once.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current admins ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {staff.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {person.name ?? person.email}
                    {person.id === session?.user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {person.email} · since {formatDate(person.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      person.role === "SUPER_ADMIN"
                        ? "bg-primary/10 text-primary"
                        : "bg-brand-mint text-brand-forest"
                    }`}
                  >
                    {person.role === "SUPER_ADMIN" ? "Master Admin" : "Admin"}
                  </span>
                  {person.role === "ADMIN" && (
                    <RemoveAdminButton
                      userId={person.id}
                      name={person.name ?? person.email}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
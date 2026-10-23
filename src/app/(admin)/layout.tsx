import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { getCurrentRole } from "@/server/auth/current-role";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { AdminTopbar } from "@/components/layout/admin/topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-braces: middleware already blocks non-admins from /admin,
  // but the layout re-checks against the database so removing an admin
  // takes effect immediately, not when their login token expires.
  if (!session?.user) {
    redirect("/?auth=login");
  }

  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isSuperAdmin={isSuperAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          name={session.user.name}
          email={session.user.email}
          isSuperAdmin={isSuperAdmin}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
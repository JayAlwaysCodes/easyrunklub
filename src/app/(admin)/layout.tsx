import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { AdminTopbar } from "@/components/layout/admin/topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-braces: middleware already blocks non-admins from /admin,
  // but the layout re-checks so this area is never rendered for the
  // wrong role even if middleware config ever changes.
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopbar name={session.user.name} email={session.user.email} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
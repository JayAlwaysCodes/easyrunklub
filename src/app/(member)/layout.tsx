import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { MemberSidebar } from "@/components/layout/member/sidebar";
import { MemberTopbar } from "@/components/layout/member/topbar";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-braces: middleware already blocks unauthenticated access to
  // /dashboard, but the layout re-checks so this area is never rendered
  // without a valid session even if middleware config ever changes.
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <MemberSidebar />
      <div className="flex flex-1 flex-col">
        <MemberTopbar name={session.user.name} email={session.user.email} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
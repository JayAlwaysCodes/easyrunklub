import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { syncMembershipDues } from "@/server/dues/sync";
import { MemberSidebar } from "@/components/layout/member/sidebar";
import { MemberTopbar } from "@/components/layout/member/topbar";
import { MemberAccessProvider } from "@/components/layout/member/member-access";

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
    redirect("/?auth=login");
  }

  // Keep dues and status current, then tell the sidebar what to unlock.
  await syncMembershipDues(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, membership: { select: { status: true } } },
  });

  const status = user?.membership?.status ?? null;
  const hasFullAccess = status === "ACTIVE" || session.user.role === "ADMIN";

  return (
    <MemberAccessProvider status={status} hasFullAccess={hasFullAccess}>
      <div className="flex min-h-screen">
        <MemberSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MemberTopbar
            name={user?.name ?? session.user.name}
            email={session.user.email}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </MemberAccessProvider>
  );
}
import { redirect } from "next/navigation";

import { getCurrentRole } from "@/server/auth/current-role";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if ((await getCurrentRole()) !== "SUPER_ADMIN") redirect("/admin/dashboard");
  return <>{children}</>;
}
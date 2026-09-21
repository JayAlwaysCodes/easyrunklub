import { PublicHeader } from "@/components/layout/public/header";
import { PublicFooter } from "@/components/layout/public/footer";
import { AuthModalProvider } from "@/components/shared/auth-modal-context";
import { AuthModals } from "@/components/shared/auth-modals";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
      <AuthModals />
    </AuthModalProvider>
  );
}
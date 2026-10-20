"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthModal } from "@/components/shared/auth-modal-context";
import { LoginForm } from "@/components/shared/login-form";
import { DisclaimerModal } from "@/components/shared/disclaimer-modal";
import { RegisterWizard } from "@/components/shared/register-wizard";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function AuthModals() {
  const { view, close } = useAuthModal();

  return (
    <Dialog open={view !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>
            {view === "login"
              ? "Log in"
              : view === "disclaimer"
                ? "Before you join"
                : "Sign up"}
          </DialogTitle>
        </VisuallyHidden>
        {view === "login" && <LoginForm />}
        {view === "disclaimer" && <DisclaimerModal />}
        {view === "register" && <RegisterWizard />}
      </DialogContent>
    </Dialog>
  );
}
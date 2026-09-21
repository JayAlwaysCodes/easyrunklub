"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthModal } from "@/components/shared/auth-modal-context";
import { LoginForm } from "@/components/shared/login-form";
import { RegisterForm } from "@/components/shared/register-form";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function AuthModals() {
  const { view, close } = useAuthModal();

  return (
    <Dialog open={view !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>
            {view === "login" ? "Log in" : "Sign up"}
          </DialogTitle>
        </VisuallyHidden>
        {view === "login" && <LoginForm />}
        {view === "register" && <RegisterForm />}
      </DialogContent>
    </Dialog>
  );
}
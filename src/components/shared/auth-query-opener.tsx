"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useAuthModal } from "@/components/shared/auth-modal-context";

// Opens the login or registration modal when the URL carries ?auth=login
// or ?auth=register (used by the /login and /register redirects).
export function AuthQueryOpener() {
  const params = useSearchParams();
  const { openLogin, openRegisterDisclaimer } = useAuthModal();
  const auth = params.get("auth");

  useEffect(() => {
    if (auth === "login") openLogin();
    else if (auth === "register") openRegisterDisclaimer();
    // Deliberately depends only on the URL value. The open functions are
    // recreated on every render, and including them would re-open the
    // modal right after the user closes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  return null;
}
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AuthModalView = "login" | "disclaimer" | "register" | null;

type AuthModalContextValue = {
  view: AuthModalView;
  openLogin: () => void;
  openRegisterDisclaimer: () => void;
  proceedToRegister: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AuthModalView>(null);

  return (
    <AuthModalContext.Provider
      value={{
        view,
        openLogin: () => setView("login"),
        openRegisterDisclaimer: () => setView("disclaimer"),
        proceedToRegister: () => setView("register"),
        close: () => setView(null),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
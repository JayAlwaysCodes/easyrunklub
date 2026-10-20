"use client";

import { createContext, useContext } from "react";

type MemberAccess = {
  status: string | null;
  // true for ACTIVE members and for admins
  hasFullAccess: boolean;
};

const MemberAccessContext = createContext<MemberAccess>({
  status: null,
  hasFullAccess: false,
});

export function MemberAccessProvider({
  status,
  hasFullAccess,
  children,
}: MemberAccess & { children: React.ReactNode }) {
  return (
    <MemberAccessContext.Provider value={{ status, hasFullAccess }}>
      {children}
    </MemberAccessContext.Provider>
  );
}

export function useMemberAccess() {
  return useContext(MemberAccessContext);
}
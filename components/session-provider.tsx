"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  clearUser,
  getUserSnapshot,
  subscribeUser,
  writeUser,
  type SessionUser,
} from "@/lib/session";

type SessionContextValue = {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const getServerSnapshot = () => null;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // null on the server and during hydration; localStorage is read once mounted.
  const user = useSyncExternalStore(subscribeUser, getUserSnapshot, getServerSnapshot);

  return (
    <SessionContext value={{ user, login: writeUser, logout: clearUser }}>
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

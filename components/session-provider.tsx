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

type SessionActions = Omit<SessionContextValue, "user">;

const SessionContext = createContext<SessionActions | null>(null);

const actions: SessionActions = { login: writeUser, logout: clearUser };

const getServerSnapshot = () => null;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionContext value={actions}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  // Subscribed per consumer, not passed through context: a consumer inside a Suspense
  // boundary that hydrates late must still hydrate with the server snapshot (null).
  const user = useSyncExternalStore(subscribeUser, getUserSnapshot, getServerSnapshot);
  return { user, ...ctx };
}

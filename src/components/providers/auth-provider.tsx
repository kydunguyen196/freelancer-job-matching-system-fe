"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";

import { login, register } from "@/lib/api";
import { clearAuthSession, getAuthSession, persistAuthSession, toAuthSession } from "@/lib/auth-storage";
import type { AuthSession, LoginRequest, RegisterRequest } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  isAuthenticated: boolean;
  loginWithPassword: (payload: LoginRequest) => Promise<AuthSession>;
  registerAccount: (payload: RegisterRequest) => Promise<AuthSession>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const subscribe = useCallback(() => () => {}, []);

  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const activeSession = ready ? (session ?? getAuthSession()) : null;

  const loginWithPassword = useCallback(async (payload: LoginRequest) => {
    const response = await login(payload);
    const nextSession = toAuthSession(response);
    persistAuthSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const registerAccount = useCallback(async (payload: RegisterRequest) => {
    const response = await register(payload);
    const nextSession = toAuthSession(response);
    persistAuthSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session: activeSession,
      isAuthenticated: Boolean(activeSession?.accessToken),
      loginWithPassword,
      registerAccount,
      logout,
    }),
    [ready, activeSession, loginWithPassword, registerAccount, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

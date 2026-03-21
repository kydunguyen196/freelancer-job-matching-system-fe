"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, LoginRequest, RegisterRequest } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  isAuthenticated: boolean;
  loginWithPassword: (payload: LoginRequest) => Promise<AuthSession>;
  registerAccount: (payload: RegisterRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const ready = useAuthStore((state) => state.ready);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const setSession = useAuthStore((state) => state.setSession);
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const registerAccount = useAuthStore((state) => state.registerAccount);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setSession(null);
    };

    window.addEventListener("skillbridge:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("skillbridge:auth-expired", handleAuthExpired);
    };
  }, [setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      isAuthenticated: Boolean(session?.userId),
      loginWithPassword,
      registerAccount,
      logout,
    }),
    [ready, session, loginWithPassword, registerAccount, logout]
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

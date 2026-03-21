"use client";

import { create } from "zustand";

import { clearAuthSession, getAuthSession, persistAuthSession } from "@/lib/auth-storage";
import { getSession, login, logoutSession, register } from "@/lib/api";
import { toApiError } from "@/lib/http/api-error";
import type { AuthSession, LoginRequest, RegisterRequest } from "@/lib/types";

type AuthState = {
  session: AuthSession | null;
  ready: boolean;
  setSession: (session: AuthSession | null) => void;
  setReady: (ready: boolean) => void;
  bootstrap: () => Promise<void>;
  loginWithPassword: (payload: LoginRequest) => Promise<AuthSession>;
  registerAccount: (payload: RegisterRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  ready: false,
  setSession: (session) => {
    persistAuthSession(session);
    set({ session });
  },
  setReady: (ready) => set({ ready }),
  bootstrap: async () => {
    const cached = getAuthSession();
    if (cached) {
      set({ session: cached });
    }

    try {
      const session = await getSession();
      persistAuthSession(session);
      set({ session, ready: true });
    } catch {
      clearAuthSession();
      set({ session: null, ready: true });
    }
  },
  loginWithPassword: async (payload) => {
    try {
      const session = await login(payload);
      persistAuthSession(session);
      set({ session });
      return session;
    } catch (error) {
      throw toApiError(error);
    }
  },
  registerAccount: async (payload) => {
    try {
      const session = await register(payload);
      persistAuthSession(session);
      set({ session });
      return session;
    } catch (error) {
      throw toApiError(error);
    }
  },
  logout: async () => {
    try {
      await logoutSession();
    } finally {
      clearAuthSession();
      set({ session: null });
    }
  },
}));

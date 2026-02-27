import type { AuthResponse, AuthSession } from "@/lib/types";

const AUTH_STORAGE_KEY = "skillbridge.auth.session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function toAuthSession(response: AuthResponse): AuthSession {
  return {
    ...response,
    expiresAt: Date.now() + response.expiresIn * 1000,
  };
}

export function persistAuthSession(session: AuthSession) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.role) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) {
    return true;
  }
  return Date.now() >= session.expiresAt - 10_000;
}

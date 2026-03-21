import type { AuthSession } from "@/lib/types";
import { isClient } from "@/lib/utils";

const AUTH_STORAGE_KEY = "skillbridge.auth.session";

let inMemorySession: AuthSession | null = null;

export function persistAuthSession(session: AuthSession | null) {
  inMemorySession = session;

  if (!isClient()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (inMemorySession) {
    return inMemorySession;
  }

  if (!isClient()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.userId || !parsed?.email || !parsed?.role) {
      persistAuthSession(null);
      return null;
    }
    inMemorySession = parsed;
    return parsed;
  } catch {
    persistAuthSession(null);
    return null;
  }
}

export function clearAuthSession() {
  persistAuthSession(null);
}

import { clearAuthSession, getAuthSession, persistAuthSession, toAuthSession } from "@/lib/auth-storage";
import type { ApiErrorPayload, AuthResponse, AuthSession } from "@/lib/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

let refreshInFlight: Promise<AuthSession | null> | null = null;

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestRaw<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const session = getAuthSession();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let fieldErrors: Record<string, string> | undefined;

    if (typeof body === "object" && body !== null) {
      const apiError = body as ApiErrorPayload;
      if (apiError.message) {
        message = apiError.message;
      }
      if (apiError.fieldErrors) {
        fieldErrors = apiError.fieldErrors;
      }
    } else if (typeof body === "string" && body.trim()) {
      message = body;
    }

    throw new ApiError(message, response.status, fieldErrors);
  }

  return body as T;
}

async function refreshAccessToken(): Promise<AuthSession | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const currentSession = getAuthSession();
  if (!currentSession?.refreshToken) {
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const authResponse = await requestRaw<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
      });
      const nextSession = toAuthSession(authResponse);
      persistAuthSession(nextSession);
      return nextSession;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, retryOnUnauthorized = true, ...requestOptions } = options;

  try {
    return await requestRaw<T>(path, requestOptions, auth);
  } catch (error) {
    if (auth && retryOnUnauthorized && error instanceof ApiError && error.status === 401) {
      const refreshedSession = await refreshAccessToken();
      if (refreshedSession?.accessToken) {
        return requestRaw<T>(path, requestOptions, true);
      }
      clearAuthSession();
    }
    throw error;
  }
}

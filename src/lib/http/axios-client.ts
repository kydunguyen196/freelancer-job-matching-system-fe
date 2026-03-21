import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_BYPASS_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/session", "/auth/logout"];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15_000),
});

let refreshPromise: Promise<void> | null = null;

function isAuthBypassRequest(config: InternalAxiosRequestConfig) {
  const url = config.url ?? "";
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
}

function ensureJsonHeaders(config: InternalAxiosRequestConfig) {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  const headers = config.headers as AxiosHeaders;
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const hasBody = config.data !== undefined && config.data !== null;
  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
}

async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = apiClient
    .post("/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  ensureJsonHeaders(config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const responseStatus = error.response?.status;
    const config = error.config as RetryableConfig | undefined;

    if (!config || responseStatus !== 401 || config._retry || isAuthBypassRequest(config)) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      await refreshSession();
      return apiClient(config);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("skillbridge:auth-expired"));
      }
      return Promise.reject(refreshError);
    }
  }
);

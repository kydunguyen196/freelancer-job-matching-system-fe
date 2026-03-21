import type { AxiosError } from "axios";

import type { ApiErrorPayload } from "@/lib/types";

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

export function toApiError(error: unknown) {
  if ((error as ApiError)?.name === "ApiError") {
    return error as ApiError;
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = axiosError.response?.status ?? 500;
  const payload = axiosError.response?.data;
  const message = payload?.message || axiosError.message || "Request failed";
  const fieldErrors = payload?.fieldErrors ?? undefined;

  return new ApiError(message, status, fieldErrors ?? undefined);
}

import { apiRequest } from "@/lib/http-client";
import type {
  AuthResponse,
  ContractResponse,
  CreateJobRequest,
  CreateProposalRequest,
  JobResponse,
  LoginRequest,
  NotificationResponse,
  ProposalResponse,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/lib/types";

function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export function login(payload: LoginRequest) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterRequest) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyProfile() {
  return apiRequest<UserProfileResponse>("/users/me", {
    auth: true,
  });
}

export function updateMyProfile(payload: UpdateProfileRequest) {
  return apiRequest<UserProfileResponse>("/users/me", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function uploadMyResume(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return apiRequest<UserProfileResponse>("/users/me/cv", {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export function listJobs(filters: { keyword?: string; status?: string; clientId?: number } = {}) {
  const query = toQueryString({
    keyword: filters.keyword,
    status: filters.status,
    clientId: filters.clientId,
  });
  return apiRequest<JobResponse[]>(`/jobs${query}`);
}

export function getJobById(jobId: number) {
  return apiRequest<JobResponse>(`/jobs/${jobId}`);
}

export function createJob(payload: CreateJobRequest) {
  return apiRequest<JobResponse>("/jobs", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function createProposal(payload: CreateProposalRequest) {
  return apiRequest<ProposalResponse>("/proposals", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function listProposalsByJob(jobId: number) {
  return apiRequest<ProposalResponse[]>(`/jobs/${jobId}/proposals`, {
    auth: true,
  });
}

export function acceptProposal(proposalId: number) {
  return apiRequest<ProposalResponse>(`/proposals/${proposalId}/accept`, {
    method: "PATCH",
    auth: true,
  });
}

export function getMyContracts() {
  return apiRequest<ContractResponse[]>("/contracts/me", {
    auth: true,
  });
}

export function getMyNotifications() {
  return apiRequest<NotificationResponse[]>("/notifications/me", {
    auth: true,
  });
}

export function markNotificationRead(notificationId: number) {
  return apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    auth: true,
  });
}

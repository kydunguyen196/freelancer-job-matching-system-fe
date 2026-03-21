import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { toApiError } from "@/lib/http/api-error";
import { apiClient } from "@/lib/http/axios-client";
import type {
  AuthSession,
  CompanySearchResponse,
  ContractResponse,
  CreateJobRequest,
  CreateMilestoneRequest,
  CreateProposalRequest,
  EmploymentType,
  FollowedCompanyResponse,
  JobDashboardResponse,
  JobResponse,
  JobSearchSuggestionResponse,
  JobSortBy,
  JobStatus,
  ListResponse,
  NotificationResponse,
  PaginationMeta,
  ProposalCvFileResponse,
  ProposalDashboardResponse,
  ProposalResponse,
  ProposalStatus,
  RegisterRequest,
  RejectProposalRequest,
  ReviewProposalRequest,
  ScheduleInterviewRequest,
  UpdateProfileRequest,
  UserProfileResponse,
  LoginRequest,
  MilestoneResponse,
} from "@/lib/types";

export type DownloadedFile = {
  blob: Blob;
  fileName: string | null;
  contentType: string | null;
};

export type JobListFilters = {
  keyword?: string;
  status?: JobStatus;
  budgetMin?: number;
  budgetMax?: number;
  clientId?: number;
  tags?: string[];
  location?: string;
  companyName?: string;
  employmentType?: EmploymentType;
  remote?: boolean;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  sortBy?: JobSortBy;
  page?: number;
  size?: number;
};

export type ProposalListFilters = {
  status?: ProposalStatus;
  page?: number;
  size?: number;
};

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    throw toApiError(error);
  }
}

function parsePagination<T>(response: AxiosResponse<T[]>): ListResponse<T> {
  const meta: PaginationMeta = {
    page: Number(response.headers["x-page"] ?? 0),
    size: Number(response.headers["x-size"] ?? response.data.length ?? 0),
    totalElements: Number(response.headers["x-total-elements"] ?? response.data.length ?? 0),
    totalPages: Number(response.headers["x-total-pages"] ?? 1),
  };

  return {
    items: response.data,
    meta,
  };
}

function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

function toDownloadedFile(response: AxiosResponse<Blob>): DownloadedFile {
  const disposition = response.headers["content-disposition"] as string | undefined;
  const contentType = response.headers["content-type"] as string | undefined;

  return {
    blob: response.data,
    fileName: getFileNameFromDisposition(disposition ?? null),
    contentType: contentType ?? null,
  };
}

function getFileNameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fallbackMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fallbackMatch?.[1] ?? null;
}

async function getList<T>(url: string, config?: AxiosRequestConfig) {
  return run(async () => {
    const response = await apiClient.get<T[]>(url, config);
    return parsePagination(response);
  });
}

export function login(payload: LoginRequest) {
  return run(async () => (await apiClient.post<AuthSession>("/auth/login", payload)).data);
}

export function register(payload: RegisterRequest) {
  return run(async () => (await apiClient.post<AuthSession>("/auth/register", payload)).data);
}

export function getSession() {
  return run(async () => (await apiClient.get<AuthSession>("/auth/session")).data);
}

export function logoutSession() {
  return run(async () => {
    await apiClient.post("/auth/logout");
  });
}

export function getMyProfile() {
  return run(async () => (await apiClient.get<UserProfileResponse>("/users/me")).data);
}

export function updateMyProfile(payload: UpdateProfileRequest) {
  return run(async () => (await apiClient.put<UserProfileResponse>("/users/me", payload)).data);
}

export function uploadMyResume(file: File) {
  return run(async () => {
    const formData = new FormData();
    formData.set("file", file);
    return (await apiClient.post<UserProfileResponse>("/users/me/cv", formData)).data;
  });
}

export function listJobs(filters: JobListFilters = {}) {
  return getList<JobResponse>("/jobs", {
    params: cleanParams({
      keyword: filters.keyword,
      status: filters.status,
      budgetMin: filters.budgetMin,
      budgetMax: filters.budgetMax,
      clientId: filters.clientId,
      tags: filters.tags,
      location: filters.location,
      companyName: filters.companyName,
      employmentType: filters.employmentType,
      remote: filters.remote,
      experienceYearsMin: filters.experienceYearsMin,
      experienceYearsMax: filters.experienceYearsMax,
      sortBy: filters.sortBy ?? "latest",
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function listMyJobs(filters: { status?: JobStatus; sortBy?: JobSortBy; page?: number; size?: number } = {}) {
  return getList<JobResponse>("/jobs/me", {
    params: cleanParams({
      status: filters.status,
      sortBy: filters.sortBy ?? "latest",
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function listSavedJobs(filters: { page?: number; size?: number } = {}) {
  return getList<JobResponse>("/jobs/saved/me", {
    params: cleanParams({
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function listFollowedCompanies(filters: { page?: number; size?: number } = {}) {
  return getList<FollowedCompanyResponse>("/jobs/companies/following/me", {
    params: cleanParams({
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function listJobSuggestions(query: string, limit = 8) {
  return run(async () => {
    const response = await apiClient.get<JobSearchSuggestionResponse[]>("/jobs/search/suggestions", {
      params: { q: query, limit },
    });
    return response.data;
  });
}

export function searchCompanies(query: string, limit = 10) {
  return run(async () => {
    const response = await apiClient.get<CompanySearchResponse[]>("/jobs/companies/search", {
      params: { q: query, limit },
    });
    return response.data;
  });
}

export function getMyJobDashboard() {
  return run(async () => (await apiClient.get<JobDashboardResponse>("/jobs/dashboard/me")).data);
}

export function getJobById(jobId: number) {
  return run(async () => (await apiClient.get<JobResponse>(`/jobs/${jobId}`)).data);
}

export function createJob(payload: CreateJobRequest) {
  return run(async () => (await apiClient.post<JobResponse>("/jobs", payload)).data);
}

export function updateJobStatus(jobId: number, status: JobStatus) {
  return run(async () => (await apiClient.patch<JobResponse>(`/jobs/${jobId}/status`, { status })).data);
}

export function closeJob(jobId: number) {
  return run(async () => (await apiClient.patch<JobResponse>(`/jobs/${jobId}/close`)).data);
}

export function saveJob(jobId: number) {
  return run(async () => (await apiClient.post<JobResponse>(`/jobs/${jobId}/save`)).data);
}

export function unsaveJob(jobId: number) {
  return run(async () => {
    await apiClient.delete(`/jobs/${jobId}/save`);
  });
}

export function followCompany(jobId: number) {
  return run(async () => (await apiClient.post<FollowedCompanyResponse>(`/jobs/${jobId}/follow-company`)).data);
}

export function unfollowCompany(jobId: number) {
  return run(async () => {
    await apiClient.delete(`/jobs/${jobId}/follow-company`);
  });
}

export function createProposal(payload: CreateProposalRequest) {
  return run(async () => (await apiClient.post<ProposalResponse>("/proposals", payload)).data);
}

export function listProposalsByJob(jobId: number, filters: ProposalListFilters = {}) {
  return getList<ProposalResponse>(`/jobs/${jobId}/proposals`, {
    params: cleanParams({
      status: filters.status,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function listMyProposals(filters: ProposalListFilters = {}) {
  return getList<ProposalResponse>("/proposals/me", {
    params: cleanParams({
      status: filters.status,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    }),
  });
}

export function getMyProposalDashboard() {
  return run(async () => (await apiClient.get<ProposalDashboardResponse>("/proposals/dashboard/me")).data);
}

export function getProposalById(proposalId: number) {
  return run(async () => (await apiClient.get<ProposalResponse>(`/proposals/${proposalId}`)).data);
}

export function reviewProposal(proposalId: number, payload: ReviewProposalRequest) {
  return run(async () => (await apiClient.patch<ProposalResponse>(`/proposals/${proposalId}/review`, payload)).data);
}

export function rejectProposal(proposalId: number, payload: RejectProposalRequest) {
  return run(async () => (await apiClient.patch<ProposalResponse>(`/proposals/${proposalId}/reject`, payload)).data);
}

export function scheduleInterview(proposalId: number, payload: ScheduleInterviewRequest) {
  return run(async () => (await apiClient.post<ProposalResponse>(`/proposals/${proposalId}/interview`, payload)).data);
}

export function acceptProposal(proposalId: number) {
  return run(async () => (await apiClient.patch<ProposalResponse>(`/proposals/${proposalId}/accept`)).data);
}

export function uploadProposalCv(proposalId: number, file: File) {
  return run(async () => {
    const formData = new FormData();
    formData.append("file", file);
    return (await apiClient.post<ProposalCvFileResponse>(`/proposals/${proposalId}/cv`, formData)).data;
  });
}

export function getProposalCv(proposalId: number) {
  return run(async () => (await apiClient.get<ProposalCvFileResponse>(`/proposals/${proposalId}/cv`)).data);
}

export function downloadProposalCv(proposalId: number) {
  return run(async () => {
    const response = await apiClient.get<Blob>(`/proposals/${proposalId}/cv/download`, {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return toDownloadedFile(response);
  });
}

export function getMyContracts() {
  return run(async () => (await apiClient.get<ContractResponse[]>("/contracts/me")).data);
}

export function addMilestone(contractId: number, payload: CreateMilestoneRequest) {
  return run(async () => (await apiClient.post<ContractResponse>(`/contracts/${contractId}/milestones`, payload)).data);
}

export function completeMilestone(milestoneId: number) {
  return run(async () => (await apiClient.patch<MilestoneResponse>(`/milestones/${milestoneId}/complete`)).data);
}

export function getMyNotifications() {
  return run(async () => (await apiClient.get<NotificationResponse[]>("/notifications/me")).data);
}

export function markNotificationRead(notificationId: number) {
  return run(async () => (await apiClient.patch<NotificationResponse>(`/notifications/${notificationId}/read`)).data);
}

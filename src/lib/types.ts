export type UserRole = "CLIENT" | "FREELANCER";
export type JobStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "CLOSED" | "EXPIRED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type ProposalStatus = "PENDING" | "REVIEWING" | "INTERVIEW_SCHEDULED" | "ACCEPTED" | "REJECTED";
export type ContractStatus = "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type MilestoneStatus = "PENDING" | "COMPLETED";
export type JobSortBy = "latest" | "salary_high" | "salary_low";

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
}

export interface AuthSession {
  expiresIn: number;
  userId: number;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserProfileResponse {
  userId: number;
  email: string;
  role: UserRole;
  skills: string[];
  hourlyRate: number | null;
  overview: string | null;
  companyName: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  address: string | null;
  companyAddress: string | null;
  resumeFileName: string | null;
}

export interface UpdateProfileRequest {
  skills?: string[] | null;
  hourlyRate?: number | null;
  overview?: string | null;
  companyName?: string | null;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  companyAddress?: string | null;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  tags: string[];
  companyName?: string | null;
  location?: string | null;
  employmentType?: EmploymentType | null;
  remote?: boolean | null;
  experienceYears?: number | null;
  status?: JobStatus | null;
  expiresAt?: string | null;
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  tags: string[];
  status: JobStatus;
  clientId: number;
  companyName: string | null;
  location: string | null;
  employmentType: EmploymentType | null;
  remote: boolean;
  experienceYears: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  closedAt: string | null;
  savedByCurrentUser: boolean;
  companyFollowedByCurrentUser: boolean;
}

export interface FollowedCompanyResponse {
  clientId: number;
  companyName: string;
  followedAt: string;
}

export interface JobSearchSuggestionResponse {
  value: string;
  type: string;
}

export interface CompanySearchResponse {
  clientId: number;
  companyName: string;
  totalJobs: number;
  openJobs: number;
  latestJobCreatedAt: string | null;
  latestJobUpdatedAt: string | null;
  locations: string[];
  employmentTypes: string[];
  topTags: string[];
}

export interface JobDashboardResponse {
  totalJobs: number;
  draftJobs: number;
  openJobs: number;
  inProgressJobs: number;
  closedJobs: number;
  expiredJobs: number;
  totalSavedJobs: number;
  totalFollowers: number;
}

export interface CreateProposalRequest {
  jobId: number;
  coverLetter: string;
  price: number;
  durationDays: number;
}

export interface ReviewProposalRequest {
  feedbackMessage: string;
}

export interface RejectProposalRequest {
  feedbackMessage: string;
}

export interface ScheduleInterviewRequest {
  interviewScheduledAt: string;
  interviewEndsAt: string;
  meetingLink?: string;
  notes?: string;
}

export interface ProposalResponse {
  id: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  freelancerEmail: string;
  coverLetter: string;
  price: number;
  durationDays: number;
  status: ProposalStatus;
  reviewedByClientId: number | null;
  reviewedAt: string | null;
  rejectedByClientId: number | null;
  rejectedAt: string | null;
  feedbackMessage: string | null;
  interviewScheduledAt: string | null;
  interviewEndsAt: string | null;
  interviewMeetingLink: string | null;
  interviewNotes: string | null;
  googleEventId: string | null;
  calendarWarning: string | null;
  acceptedByClientId: number | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalCvFileResponse {
  id: number;
  proposalId: number;
  ownerUserId: number;
  originalFileName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  storageProvider: string;
  bucketName: string | null;
  uploadedAt: string;
  downloadUrl: string;
  downloadUrlExpiresAt: string | null;
  directDownload: boolean;
}

export interface JobProposalStatsResponse {
  jobId: number;
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  interviewsScheduled: number;
  acceptedApplications: number;
  rejectedApplications: number;
}

export interface ProposalDashboardResponse {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  interviewsScheduled: number;
  acceptedApplications: number;
  rejectedApplications: number;
  jobStats: JobProposalStatsResponse[];
}

export interface MilestoneResponse {
  id: number;
  contractId: number;
  title: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractResponse {
  id: number;
  sourceProposalId: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  milestones: MilestoneResponse[];
}

export interface CreateMilestoneRequest {
  title: string;
  amount: number;
  dueDate: string;
}

export interface NotificationResponse {
  id: number;
  recipientUserId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
